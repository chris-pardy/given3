import { Test } from './test';

export class Describe {
  readonly #name: string | undefined;
  readonly #children: (Describe | Test)[] = [];
  readonly #beforeAll: (() => Promise<void>)[] = [];
  readonly #beforeEach: (() => Promise<void>)[] = [];
  readonly #afterEach: (() => Promise<void>)[] = [];
  readonly #afterAll: (() => Promise<void>)[] = [];

  constructor(
    name: string | undefined,
    children: (Describe | Test)[],
    beforeAll: (() => Promise<void>)[],
    beforeEach: (() => Promise<void>)[],
    afterEach: (() => Promise<void>)[],
    afterAll: (() => Promise<void>)[]
  ) {
    this.#name = name;
    this.#children = children;
    this.#beforeAll = beforeAll;
    this.#beforeEach = beforeEach;
    this.#afterEach = afterEach;
    this.#afterAll = afterAll;
  }

  eval(describeBlock: () => void): void {
    const previousDescribe = global.describe;
    const previousTest = global.test;
    const previousIt = global.it;
    const previousBeforeAll = global.beforeAll;
    const previousBeforeEach = global.beforeEach;
    const previousAfterEach = global.afterEach;
    const previousAfterAll = global.afterAll;
    global.describe = this.describe.bind(this) as jest.Describe;
    global.test = this.it.bind(this) as jest.It;
    global.it = this.it.bind(this) as jest.It;
    global.beforeAll = this.beforeAll.bind(this) as jest.Lifecycle;
    global.beforeEach = this.beforeEach.bind(this) as jest.Lifecycle;
    global.afterEach = this.afterEach.bind(this) as jest.Lifecycle;
    global.afterAll = this.afterAll.bind(this) as jest.Lifecycle;
    try {
      describeBlock();
    } finally {
      global.describe = previousDescribe;
      global.test = previousTest;
      global.it = previousIt;
      global.beforeAll = previousBeforeAll;
      global.beforeEach = previousBeforeEach;
      global.afterEach = previousAfterEach;
      global.afterAll = previousAfterAll;
    }
  }

  describe(name: string, describeBlock: () => void): void {
    const block = new Describe(name, [], [], [], [], []);
    this.#children.push(block);
    block.eval(describeBlock);
  }

  it(name: string, testCode: () => Promise<void>): void {
    this.#children.push(new Test(name, testCode));
  }

  beforeAll(before: () => Promise<void>): void {
    this.#beforeAll.push(before);
  }

  beforeEach(before: () => Promise<void>): void {
    this.#beforeEach.push(before);
  }

  afterEach(after: () => Promise<void>): void {
    this.#afterEach.push(after);
  }

  afterAll(after: () => Promise<void>): void {
    this.#afterAll.push(after);
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
      this.#afterAll
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
