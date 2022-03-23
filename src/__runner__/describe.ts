import { Test } from './test';

type HookFn = (done?: (err?: unknown) => void) => void | Promise<void>;

export class Describe {
  readonly #name: string | undefined;
  readonly #children: (Describe | Test)[] = [];
  readonly #beforeAll: (() => Promise<void>)[] = [];
  readonly #beforeEach: (() => Promise<void>)[] = [];
  readonly #afterEach: (() => Promise<void>)[] = [];
  readonly #afterAll: (() => Promise<void>)[] = [];
  readonly #mode: 'Jest' | 'Mocha';

  constructor(
    name: string | undefined,
    children: (Describe | Test)[],
    beforeAll: (() => Promise<void>)[],
    beforeEach: (() => Promise<void>)[],
    afterEach: (() => Promise<void>)[],
    afterAll: (() => Promise<void>)[],
    mode: 'Jest' | 'Mocha'
  ) {
    this.#name = name;
    this.#children = children;
    this.#beforeAll = beforeAll;
    this.#beforeEach = beforeEach;
    this.#afterEach = afterEach;
    this.#afterAll = afterAll;
    this.#mode = mode;
  }

  #callbackToPromise(hook: HookFn): () => Promise<void> {
    if (hook.length === 1) {
      return () =>
        new Promise((res, rej) => {
          try {
            hook((err) => {
              if (err) {
                rej(err);
              } else {
                res();
              }
            });
          } catch (err) {
            rej(err);
          }
        });
    } else {
      return async () => {
        const result = hook();
        // mocha doesn't support returning a promise
        if (this.#mode === 'Jest') {
          await result;
        }
        return;
      };
    }
  }

  eval(describeBlock: () => void): void {
    const previousDescribe = global.describe;
    const previousTest = global.test;
    const previousIt = global.it;
    const previousBeforeAll = global.beforeAll;
    const previousBefore = global.before;
    const previousBeforeEach = global.beforeEach;
    const previousAfterEach = global.afterEach;
    const previousAfterAll = global.afterAll;
    const previousAfter = global.after;
    global.describe = this.describe.bind(this) as jest.Describe & Mocha.SuiteFunction;
    global.test = this.it.bind(this) as jest.It & Mocha.TestFunction;
    global.it = this.it.bind(this) as jest.It & Mocha.TestFunction;
    if (this.#mode === 'Jest') {
      global.beforeAll = this.beforeAll.bind(this) as jest.Lifecycle;
    } else {
      global.before = this.beforeAll.bind(this) as Mocha.HookFunction;
    }
    global.beforeEach = this.beforeEach.bind(this) as jest.Lifecycle & Mocha.HookFunction;
    global.afterEach = this.afterEach.bind(this) as jest.Lifecycle & Mocha.HookFunction;
    if (this.#mode === 'Jest') {
      global.afterAll = this.afterAll.bind(this) as jest.Lifecycle;
    } else {
      global.after = this.afterAll.bind(this) as Mocha.HookFunction;
    }
    try {
      describeBlock();
    } finally {
      global.describe = previousDescribe;
      global.test = previousTest;
      global.it = previousIt;
      global.beforeAll = previousBeforeAll;
      global.before = previousBefore;
      global.beforeEach = previousBeforeEach;
      global.afterEach = previousAfterEach;
      global.afterAll = previousAfterAll;
      global.after = previousAfter;
    }
  }

  describe(name: string, describeBlock: () => void): void {
    const block = new Describe(name, [], [], [], [], [], this.#mode);
    this.#children.push(block);
    block.eval(describeBlock);
  }

  it(name: string, testCode: HookFn): void {
    this.#children.push(new Test(name, this.#callbackToPromise(testCode)));
  }

  beforeAll(before: HookFn): void {
    this.#beforeAll.push(this.#callbackToPromise(before));
  }

  beforeEach(before: HookFn): void {
    this.#beforeEach.push(this.#callbackToPromise(before));
  }

  afterEach(after: HookFn): void {
    this.#afterEach.push(this.#callbackToPromise(after));
  }

  afterAll(after: HookFn): void {
    this.#afterAll.push(this.#callbackToPromise(after));
  }

  filter(partialName: string): Describe | null {
    if (this.#name && this.#name.includes(partialName)) {
      return this;
    }
    const newChildren = this.#children
      .map((c) => c.filter(partialName))
      .filter((c): c is Describe | Test => c !== null);
    if (!newChildren.length) {
      return null;
    }
    return new Describe(
      this.#name,
      newChildren,
      this.#beforeAll,
      this.#beforeEach,
      this.#afterEach,
      this.#afterAll,
      this.#mode
    );
  }

  async run(before: () => Promise<void>, after: () => Promise<void>): Promise<void> {
    const beforeEach = async (): Promise<void> => {
      await before();
      for (const b of this.#beforeEach) {
        await b();
      }
    };
    const afterEach = async (): Promise<void> => {
      for (const a of this.#afterEach) {
        await a();
      }
      await after();
    };
    for (const b of this.#beforeAll) {
      await b();
    }
    for (const c of this.#children) {
      await c.run(beforeEach, afterEach);
    }
    for (const a of this.#afterAll) {
      await a();
    }
  }
}
