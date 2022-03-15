// Global afterEach runs after every test and gives us a place to handling any cleanUps that are defined inside a test.
const afterTestStack: (() => Promise<void>)[] = [];
afterEach(async () => {
  // take all the items from the stack from front to back.
  for (let cleanup = afterTestStack.shift(); cleanup; cleanup = afterTestStack.shift()) {
    try {
      await cleanup();
    } catch (err) {
      console.error(err);
    }
  }
});

/**
 * We need to track if we're inside a test do that with a global beforeAll and afterAll
 */
let isIt = false;

beforeAll(() => {
  isIt = true;
});

afterAll(() => {
  isIt = false;
});

/** run the init function before a tests, beforeEach */
export const beforeTest = (init: () => void): void => {
  if (isIt) {
    init();
  } else {
    beforeEach(init);
  }
};

/**
 * run the cleanup task after the test, use the afterTest stack to queue the task if we're in a test
 */
export const afterTest = (cleanup: () => Promise<void>): void => {
  if (isIt) {
    afterTestStack.unshift(cleanup);
  } else {
    afterEach(cleanup);
  }
};

/**
 * Given a setup step run it at the beginning of the current scope
 * this is a beforeAll hook if the beforeAll hook exists
 * otherwise it runs the setup step because that means we're in a test.
 * @param setup
 */
export const begin = (setup: () => void): void => {
  if (isIt) {
    setup();
  } else {
    beforeAll(setup);
  }
};

/**
 *
 * @param teardown
 */
export const end = (teardown: () => Promise<void>): void => {
  if (isIt) {
    afterTestStack.unshift(teardown);
  } else {
    afterAll(teardown);
  }
};
