import { LifecycleError } from './errors';
import type { Given } from './given';
import { beforeTestAsync } from './test-hooks';

/**
 * when passed a series of Given's resolves their values before
 * any test in the current suite. Leverages the <pre>beforeEach</pre> test block
 * to fetch the values. If any of the values are promises it awaits them
 * to ensure they're fully resolved. Because the givens make use of caching these values
 * can later be accessed in the test without recomputing.
 * @param givens 
 */
export const using = (...givens: Given<unknown>[]): void => {
  try {
    beforeTestAsync(async () => {
      await Promise.all(givens.map(async (given) => await given.value));
    });
  } catch {
    throw new LifecycleError('using');
  }
};

export type Using = typeof using;
