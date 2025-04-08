import type { RegisterCleanupFunction } from "./given.mjs";
import type { GivenImpl } from "./given-impl.mjs";
import { NoDefinitionError, CircularReferenceError } from "./errors.mjs";
import type { AsyncLocalStorage } from "node:async_hooks";
import { toCleanUp, isDisposable } from "./disposable.mjs";

/**
 * A Frame is a member of a stack that holds a definition, cache, and supports cleanup functions
 */
export interface Frame<T> {
  /**
   * Gets the value of the frame
   */
  getValue(): PromiseSettledResult<T>;
  /**
   * Releases the frame, calling all cleanup functions
   */
  release(): Promise<void>;
  /**
   * The previous frame in the stack
   */
  previous?: Frame<T>;
}

/**
 * A Frame that has no definition, the default for all givens
 */
export class EmptyFrame<T> implements Frame<T> {
  readonly #given: GivenImpl<T>;
  previous?: Frame<T>;

  constructor(given: GivenImpl<T>) {
    this.#given = given;
  }

  getValue(): PromiseSettledResult<T> {
    return {
      status: "rejected",
      reason: new NoDefinitionError(this.#given),
    };
  }

  async release() {}
}

/**
 * A Frame that has a definition, and supports cleanup functions
 */
export class DefineFrame<T> implements Frame<T> {
  readonly #given: GivenImpl<T>;
  readonly #definition: (
    registerCleanup: RegisterCleanupFunction,
  ) => PromiseSettledResult<T>;
  readonly #cleanups: (() => void | Promise<void>)[] = [];
  readonly #get: AsyncLocalStorage<
    <TR>(given: GivenImpl<TR>) => PromiseSettledResult<TR>
  >;
  readonly #registerCleanup: AsyncLocalStorage<RegisterCleanupFunction>;
  /**
   * Whether the value is currently being computed
   */
  #isComputing = false;
  previous?: Frame<T>;

  constructor(
    given: GivenImpl<T>,
    definition: (
      registerCleanup: RegisterCleanupFunction,
    ) => PromiseSettledResult<T>,
    get: AsyncLocalStorage<
      <TR>(given: GivenImpl<TR>) => PromiseSettledResult<TR>
    >,
    registerCleanup: AsyncLocalStorage<RegisterCleanupFunction>,
  ) {
    this.#given = given;
    this.#definition = definition;
    this.#get = get;
    this.#registerCleanup = registerCleanup;
  }

  getValue(): PromiseSettledResult<T> {
    // re-entrance check for circular references
    if (this.#isComputing) {
      return {
        status: "rejected",
        reason: new CircularReferenceError(this.#given),
      };
    }
    // mark that we're computing the value
    this.#isComputing = true;
    try {
      // get the value of the given
      const result = this.#get.run(
        <TR,>(impl: GivenImpl<TR>) => {
          // if this definition references itself return the previous frame's value
          if (impl === (this.#given as GivenImpl<unknown>)) {
            if (this.previous) {
              return this.previous.getValue() as PromiseSettledResult<TR>;
            }
            throw new NoDefinitionError(this.#given);
          }
          // get the value of the given
          return impl.currentFrame.getValue();
        },
        () =>
          this.#registerCleanup.run(
            (cleanup) => this.#cleanups.push(toCleanUp(cleanup)),
            () =>
              // run the definition, registering cleanup functions
              this.#definition((cleanup) =>
                this.#cleanups.push(toCleanUp(cleanup)),
              ),
          ),
      );
      // if the value is a function or object, that has a dispose method, add it to the cleanup functions
      if (result.status === "fulfilled" && isDisposable(result.value)) {
        this.#cleanups.push(toCleanUp(result.value));
      }
      return result;
    } finally {
      // reset the re-entrance check
      this.#isComputing = false;
    }
  }

  async release() {
    // call all cleanup functions
    for (const cleanup of this.#cleanups) {
      await cleanup();
    }
    // clear the cleanup functions
    this.#cleanups.length = 0;
  }
}

type SmartCacheEntry<T> = {
  /**
   * The dependencies of the cache entry
   */
  dependencies: Map<GivenImpl<unknown>, PromiseSettledResult<unknown>>;
  /**
   * The result of the cache entry
   */
  result: PromiseSettledResult<T>;
};

/**
 * A Frame that supports smart caching,
 * smart caching re-uses values when any dependencies that it depends on have not been changed
 */
export class SmartCacheFrame<T> extends DefineFrame<T> {
  readonly #cache: SmartCacheEntry<T>[] = [];

  constructor(
    given: GivenImpl<T>,
    definition: (
      registerCleanup: RegisterCleanupFunction,
    ) => PromiseSettledResult<T>,
    get: AsyncLocalStorage<
      <TR>(given: GivenImpl<TR>) => PromiseSettledResult<TR>
    >,
    registerCleanup: AsyncLocalStorage<RegisterCleanupFunction>,
  ) {
    super(
      given,
      (registerCleanup) => {
        // map of given impls to their result
        // this is used to prevent duplicate calls to the same given
        const callOnceCache = new Map<
          GivenImpl<unknown>,
          PromiseSettledResult<unknown>
        >();
        const getValue = get.getStore()!;
        const cachedOnceGetValue = <TR,>(
          impl: GivenImpl<TR>,
        ): PromiseSettledResult<TR> => {
          // if the value has already been computed, return it
          if (callOnceCache.has(impl)) {
            const result = callOnceCache.get(impl);
            // delete the value from the cache to prevent it from being reused
            callOnceCache.delete(impl);
            return result as PromiseSettledResult<TR>;
          }
          return getValue(impl);
        };
        return get.run(cachedOnceGetValue, () => {
          // iterate through all the cache entries
          cacheEntry: for (const entry of this.#cache) {
            // for each cache entry check if any of the dependencies have changed
            for (const [dependency, result] of entry.dependencies.entries()) {
              const currentResult = cachedOnceGetValue(dependency);
              // set the result in the call once cache to prevent duplicate calls
              callOnceCache.set(dependency, currentResult);
              // if the dependency has changed, continue to the next cache entry
              if (currentResult.status !== result.status) {
                continue cacheEntry;
              }
              if (
                currentResult.status === "fulfilled" &&
                result.status === "fulfilled" &&
                currentResult.value !== result.value
              ) {
                continue cacheEntry;
              }
              if (
                currentResult.status === "rejected" &&
                result.status === "rejected" &&
                currentResult.reason !== result.reason
              ) {
                continue cacheEntry;
              }
            }
            // if all the dependencies have not changed, return the cached value
            return entry.result;
          }
          // no cached entries are valid, create a new one
          // create a map of dependencies to their results
          const dependencies = new Map<
            GivenImpl<unknown>,
            PromiseSettledResult<unknown>
          >();
          // register a cleanup function to remove the cache entry when the frame is released
          registerCleanup(() => {
            const index = this.#cache.findIndex(
              (e) => e.dependencies === dependencies,
            );
            if (index !== -1) {
              this.#cache.splice(index, 1);
            }
          });
          // function to track the given.value calls within the definition
          const trackDeps = <TR,>(
            impl: GivenImpl<TR>,
          ): PromiseSettledResult<TR> => {
            // get the value of the given
            const result = cachedOnceGetValue(impl);
            // set the result in the dependencies map
            dependencies.set(impl, result);
            // return the result
            return result;
          };
          // run the definition, registering cleanup functions
          const result = get.run(trackDeps, () => definition(registerCleanup));
          // add the cache entry to the cache
          this.#cache.push({ dependencies, result });
          // return the result
          return result;
        });
      },
      get,
      registerCleanup,
    );
  }
}
