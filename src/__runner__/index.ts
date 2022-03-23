import type { GivenConstructor, Given2 } from 'given3';
import { Describe } from './describe';

export interface TestRunner {
  filter(partialName?: string): TestRunner;
  run(): Promise<void>;
}

class JestLikeImpl implements TestRunner {
  readonly #root: Describe | null;

  constructor(root: Describe | null) {
    this.#root = root;
  }

  filter(partialName?: string): TestRunner {
    if (partialName && this.#root) {
      return new JestLikeImpl(this.#root.filter(partialName));
    }
    return this;
  }

  async run(): Promise<void> {
    if (this.#root) {
      // suspend the environment during the test run
      const previousDescribe = global.describe;
      const previousTest = global.test;
      const previousIt = global.it;
      const previousBeforeAll = global.beforeAll;
      const previousBefore = global.before;
      const previousBeforeEach = global.beforeEach;
      const previousAfterEach = global.afterEach;
      const previousAfterAll = global.afterAll;
      const previousAfter = global.after;
      global.describe = undefined as any;
      global.test = undefined as any;
      global.it = undefined as any;
      global.beforeAll = undefined as any;
      global.before = undefined as any;
      global.beforeEach = undefined as any;
      global.afterEach = undefined as any;
      global.afterAll = undefined as any;
      global.after = undefined as any;
      try {
        await this.#root.run(
          () => Promise.resolve(),
          () => Promise.resolve()
        );
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
  }
}

export const suite = (
  mode: 'Jest' | 'Mocha',
  block: (modules: { given: GivenConstructor; given2: Given2 }) => void
): TestRunner => {
  const d = new Describe(undefined, [], [], [], [], [], mode);
  d.eval(() => {
    jest.resetModuleRegistry();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { given, given2 } = require('given3') as { given: GivenConstructor; given2: Given2 };
    block({ given, given2 });
  });
  return new JestLikeImpl(d);
};
