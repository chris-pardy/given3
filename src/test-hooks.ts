const asyncToCallback =
  (asyncFn: () => Promise<void>) =>
  (done: (err?: unknown) => void): void => {
    try {
      asyncFn().then(
        () => done(),
        (err) => done(err)
      );
    } catch (err) {
      done(err);
    }
  };

// Global afterEach runs after every test and gives us a place to handling any cleanUps that are defined inside a test.
const afterTestStack: (() => Promise<void>)[] = [];
afterEach(
  asyncToCallback(async () => {
    // take all the items from the stack from front to back.
    for (let cleanup = afterTestStack.shift(); cleanup; cleanup = afterTestStack.shift()) {
      try {
        await cleanup();
      } catch (err) {
        console.error(err);
      }
    }
  })
);

/**
 * We need to track if we're inside a test
 */
let isIt = false;

/** run the init function before a tests, beforeEach */
export const beforeTest = (init: () => void): void => {
  if (isIt) {
    init();
  } else {
    beforeEach(init);
  }
};

/**
 * Run the init function before a test, beforeEach, if we're already
 * in the test run then throw an error. as calling this function will
 * fail.
 */
export const beforeTestAsync = (init: () => Promise<void>): void => {
  if (isIt) {
    throw new Error();
  } else {
    beforeEach(asyncToCallback(init));
  }
};

/**
 * run the cleanup task after the test, use the afterTest stack to queue the task if we're in a test
 */
export const afterTest = (cleanup: () => Promise<void>): void => {
  if (isIt) {
    afterTestStack.unshift(cleanup);
  } else {
    afterEach(asyncToCallback(cleanup));
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
    if (typeof before === 'function') {
      before(setup);
      return;
    }
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
    if (typeof after === 'function') {
      after(asyncToCallback(teardown));
      return;
    }
    afterAll(teardown);
  }
};

// A Global beforeAll block will be run to indicate that we're inside a test.
begin(() => {
  isIt = true;
});

end(async () => {
  isIt = false;
});
