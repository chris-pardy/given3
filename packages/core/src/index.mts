import type {
  Given,
  GivenDefinition,
  GivenOptions,
  GivenConstructor,
  TestHooks,
} from "./given.mjs";
import { GivenImpl } from "./given-impl.mjs";
import { AsyncLocalStorage } from "node:async_hooks";

/**
 * A middleware function that can be used to modify a Given instance on creation.
 */
export type GivenMiddleware = <T>(given: Given<T>) => Given<T>;

/**
 * The AsyncLocalStorage instance for registering functions that resolve givens
 */
const get = new AsyncLocalStorage<
  <T>(given: GivenImpl<T>) => PromiseSettledResult<T>
>();

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

/**
 * Test hooks, including some setup to ensure that when a given is defined in a test it still works
 */
class TestHooksImpl implements Omit<TestHooks, "beforeEach"> {
  readonly #hooks: TestHooks;
  readonly #afterTests: (() => void | Promise<void>)[] = [];
  #inTest: boolean = false;

  constructor(hooks: TestHooks) {
    this.#hooks = hooks;
    hooks.beforeEach(() => (this.#inTest = true));
    hooks.afterEach(() => {
      this.#inTest = false;
      for (const afterTest of this.#afterTests) {
        afterTest();
      }
      this.#afterTests.length = 0;
    });
  }

  beforeAll(hookFn: () => void): void {
    if (this.#inTest) {
      hookFn();
    } else {
      this.#hooks.beforeAll(hookFn);
    }
  }

  afterEach(hookFn: () => void | Promise<void>): void {
    if (this.#inTest) {
      this.#afterTests.push(hookFn);
    } else {
      this.#hooks.afterEach(hookFn);
    }
  }

  afterAll(hookFn: () => void | Promise<void>): void {
    if (this.#inTest) {
      this.#afterTests.push(hookFn);
    } else {
      this.#hooks.afterAll(hookFn);
    }
  }
}

/**
 * Creates a constructor function for creating Given instances
 * @returns A function that can be used to create Given instances
 */
export function createGivenConstructor(
  testHooks: TestHooks,
  ...middlewares: GivenMiddleware[]
): GivenConstructor {
  const hookImpl = new TestHooksImpl(testHooks);
  function given<T>(
    nameOrDefinition?: string | GivenDefinition<T>,
    optionsOrDefinition?: GivenOptions | GivenDefinition<T>,
    options?: GivenOptions,
  ): Given<T> {
    let impl: Given<T> = new GivenProxy<T>(
      typeof nameOrDefinition === "string"
        ? new GivenImpl<T>(hookImpl, get, nameOrDefinition)
        : new GivenImpl<T>(hookImpl, get),
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
  }
  return given;
}

export type {
  Given,
  GivenDefinition,
  GivenOptions,
  GivenConstructor,
  TestHooks,
};
