import { GivenConstructor } from 'given3';
import { Describe } from './describe';

export interface JestLike {
  filter(partialName?: string): JestLike;
  run(): Promise<void>;
}

class JestLikeImpl implements JestLike {
  readonly #root: Describe | null;

  constructor(root: Describe | null) {
    this.#root = root;
  }

  filter(partialName?: string): JestLike {
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
      const previousBeforeEach = global.beforeEach;
      const previousAfterEach = global.afterEach;
      const previousAfterAll = global.afterAll;
      global.describe = undefined as any;
      global.test = undefined as any;
      global.it = undefined as any;
      global.beforeAll = undefined as any;
      global.beforeEach = undefined as any;
      global.afterEach = undefined as any;
      global.afterAll = undefined as any;
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
        global.beforeEach = previousBeforeEach;
        global.afterEach = previousAfterEach;
        global.afterAll = previousAfterAll;
      }
    }
  }
}

export const jestLike = (block: (modules: { given: GivenConstructor }) => void): JestLike => {
  const d = new Describe(undefined, [], [], [], [], []);
  jest.resetModuleRegistry();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  d.eval(() => block({ given: require('given3').given as GivenConstructor }));
  return new JestLikeImpl(d);
};
