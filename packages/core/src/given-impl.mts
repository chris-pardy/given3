import type {
  GivenDefinition,
  GivenOptions,
  Given,
  TestHooks,
} from "./given.mjs";
import {
  type Frame,
  EmptyFrame,
  DefineFrame,
  SmartCacheFrame,
} from "./frames.mjs";
import type { AsyncLocalStorage } from "node:async_hooks";

function asPromiseResult<T>(
  definition: GivenDefinition<T>,
): GivenDefinition<PromiseSettledResult<T>> {
  return (registerCleanup) => {
    try {
      return {
        status: "fulfilled",
        value: definition(registerCleanup),
      };
    } catch (error) {
      return {
        status: "rejected",
        reason: error,
      };
    }
  };
}

export class GivenImpl<T> implements Given<T> {
  readonly name?: string;

  readonly #hooks: Omit<TestHooks, "beforeEach">;
  readonly #get: AsyncLocalStorage<
    <T>(givenImpl: GivenImpl<T>) => PromiseSettledResult<T>
  >;
  #frame: Frame<T> = new EmptyFrame(this);

  constructor(
    hooks: Omit<TestHooks, "beforeEach">,
    get: AsyncLocalStorage<
      <T>(givenImpl: GivenImpl<T>) => PromiseSettledResult<T>
    >,
    name?: string,
  ) {
    this.#hooks = hooks;
    this.#get = get;
    this.name = name;
  }

  get value(): T {
    const getValue = this.#get.getStore();
    // if a resolver doesn't exist in the store just return the top frame's value
    const result = getValue ? getValue(this) : this.#frame.getValue();
    // unwrap the PromiseSettledResult
    if (result.status === "rejected") {
      throw result.reason;
    }
    return result.value;
  }

  get currentFrame(): Frame<T> {
    return this.#frame;
  }

  define(
    definition: GivenDefinition<T>,
    { cache = "Each" }: GivenOptions = {},
  ): this {
    const frame =
      cache === false
        ? new DefineFrame(this, asPromiseResult(definition), this.#get)
        : new SmartCacheFrame(this, asPromiseResult(definition), this.#get);
    
    // mount
    this.#hooks.beforeAll(() => {
      frame.previous = this.#frame;
      this.#frame = frame;
    });
    
    // if the cache is each call release after each test
    if (cache === "Each") {
      this.#hooks.afterEach(() => {
        frame.release();
      });
    }

    // unmount
    this.#hooks.afterAll(() => {
        // can't use frame here since the order of the afterAll hooks and the stacked nature of frames
        // can cause problems if multiple definitions for a single given are pushed in a single describe block
      const head = this.#frame;
      if (head.previous) {
        this.#frame = head.previous;
      }
      head.release();
    });
    
    // return the given impl for chaining
    return this;
  }
}
