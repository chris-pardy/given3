import { TestHooks } from "../given.mjs";

class Suite {
  readonly #hooks: TestingHooks;
  readonly #parent: Suite | undefined;

  readonly #beforeAllHooks: (() => void)[] = [];
  readonly #beforeEachHooks: (() => void)[] = [];
  readonly #afterEachHooks: (() => void | Promise<void>)[] = [];
  readonly #afterAllHooks: (() => void | Promise<void>)[] = [];

  constructor(hooks: TestingHooks, parent?: Suite) {
    this.#hooks = hooks;
    this.#parent = parent;
  }

  beforeAll(hookFn: () => void): void {
    this.#beforeAllHooks.push(hookFn);
  }

  async #runBeforeAllHooks(): Promise<void> {
    if (this.#parent) {
      await this.#parent.#runBeforeAllHooks();
    }
    for (const hook of this.#beforeAllHooks) {
      await hook();
    }
    this.#beforeAllHooks.length = 0;
  }

  beforeEach(hookFn: () => void): void {
    this.#beforeEachHooks.push(hookFn);
  }

  async #runBeforeEachHooks(): Promise<void> {
    if (this.#parent) {
      await this.#parent.#runBeforeEachHooks();
    }
    for (const hook of this.#beforeEachHooks) {
      await hook();
    }
  }

  afterEach(hookFn: () => void | Promise<void>): void {
    this.#afterEachHooks.push(hookFn);
  }

  async #runAfterEachHooks(): Promise<void> {
    for (const hook of this.#afterEachHooks) {
      await hook();
    }
    if (this.#parent) {
      await this.#parent.#runAfterEachHooks();
    }
  }

  afterAll(hookFn: () => void | Promise<void>): void {
    this.#afterAllHooks.push(hookFn);
  }

  async #runAfterAllHooks(): Promise<void> {
    for (const hook of this.#afterAllHooks) {
      await hook();
    }
    this.#afterAllHooks.length = 0;
  }

  async suite(creator: () => Promise<void> | void): Promise<void> {
    const suite = new Suite(this.#hooks, this);
    this.#hooks.activeSuite = suite;
    await creator();
    this.#hooks.activeSuite = this;
    await suite.#runAfterAllHooks();
  }

  async test(testFn: () => Promise<void> | void): Promise<void> {
    await this.#runBeforeAllHooks();
    await this.#runBeforeEachHooks();
    await testFn();
    await this.#runAfterEachHooks();
  }
}

export class TestingHooks implements TestHooks {
  activeSuite: Suite = new Suite(this);

  beforeAll(hookFn: () => void): void {
    this.activeSuite.beforeAll(hookFn);
  }

  beforeEach(hookFn: () => void): void {
    this.activeSuite.beforeEach(hookFn);
  }

  afterEach(hookFn: () => void | Promise<void>): void {
    this.activeSuite.afterEach(hookFn);
  }

  afterAll(hookFn: () => void | Promise<void>): void {
    this.activeSuite.afterAll(hookFn);
  }

  async suite(creator: () => Promise<void> | void): Promise<void> {
    return this.activeSuite.suite(creator);
  }

  async test(testFn: () => Promise<void> | void): Promise<void> {
    return this.activeSuite.test(testFn);
  }
}
