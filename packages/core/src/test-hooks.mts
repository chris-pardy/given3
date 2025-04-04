import { TestHooks } from "./given.mjs";

/**
 * Test hooks, including some setup to ensure that when a given is defined in a test it still works
 */
export class TestHooksImpl implements Omit<TestHooks, "beforeEach"> {
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
