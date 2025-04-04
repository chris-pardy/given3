import type {
  Given,
  GivenDefinition,
  GivenOptions,
  GivenConstructor,
  TestHooks,
  RegisterCleanupFunction,
  CleanupFunction,
} from "./given.mjs";
import { GivenImpl } from "./given-impl.mjs";
import { AsyncLocalStorage } from "node:async_hooks";
import { TestHooksImpl } from "./test-hooks.mjs";
import { toCleanUp } from "./disposable.mjs";

/**
 * A middleware function that can be used to modify a Given instance on creation.
 */
export type GivenMiddleware = <T>(given: Given<T>) => Given<T>;

/**
 * A proxy for a Given instance that is used to hide some fields on GivenImpl from introspection
 */
class GivenProxy<T> implements Given<T> {
  readonly #given: Given<T>;

  constructor(given: Given<T>) {
    this.#given = given;
  }

  get name(): string | undefined {
    return this.#given.name;
  }

  get value(): T {
    return this.#given.value;
  }

  define(definition: GivenDefinition<T>, options?: GivenOptions): this {
    this.#given.define(definition, options);
    return this;
  }
}

export type GivenLibrary = {
  cleanup: RegisterCleanupFunction;
  createGivenConstructor: (
    ...middlewares: GivenMiddleware[]
  ) => GivenConstructor;
};

export function createGivenLibrary(testHooks: TestHooks): GivenLibrary {
  const hookImpl = new TestHooksImpl(testHooks);
  /**
   * The AsyncLocalStorage instance for registering functions that resolve givens
   */
  const get = new AsyncLocalStorage<
    <T>(given: GivenImpl<T>) => PromiseSettledResult<T>
  >();

  const registerCleanup = new AsyncLocalStorage<RegisterCleanupFunction>();
  return {
    cleanup: (cleanup: CleanupFunction | Disposable | AsyncDisposable) => {
      const register = registerCleanup.getStore();
      if (register) {
        register(cleanup);
      } else {
        hookImpl.afterAll(toCleanUp(cleanup));
      }
    },
    createGivenConstructor: (...middlewares: GivenMiddleware[]) => {
      return function given<T>(
        nameOrDefinition?: string | GivenDefinition<T>,
        optionsOrDefinition?: GivenOptions | GivenDefinition<T>,
        options?: GivenOptions,
      ): Given<T> {
        let impl: Given<T> = new GivenProxy<T>(
          typeof nameOrDefinition === "string"
            ? new GivenImpl<T>(hookImpl, get, registerCleanup, nameOrDefinition)
            : new GivenImpl<T>(hookImpl, get, registerCleanup),
        );
        for (const middleware of middlewares) {
          impl = middleware(impl);
        }
        if (typeof nameOrDefinition === "function") {
          impl.define(
            nameOrDefinition,
            optionsOrDefinition as GivenOptions | undefined,
          );
        } else if (typeof optionsOrDefinition === "function") {
          impl.define(optionsOrDefinition, options);
        }
        return impl;
      };
    },
  };
}

export type {
  Given,
  GivenDefinition,
  GivenOptions,
  GivenConstructor,
  TestHooks,
  CleanupFunction,
};
