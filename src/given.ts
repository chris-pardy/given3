import { DefineFrame, CleanUpFrame, CacheFrame, emptyFrame } from './frames';
import type { Frame } from './frames';
import { afterTest, beforeTest, begin, end } from './test-hooks';
import { LoopDetectionError } from './errors';

/**
 * 'All' scope runs in beforeAll or afterAll
 * 'Each' scope runs in beforeEach or afterEach
 */
export type Scopes = 'All' | 'Each';

/**
 * Options when defining a Given
 */
export interface GivenOptions {
  /**
   * if true, value will be computed during a beforeEach phase
   */
  immediate?: boolean;
  /**
   * if false value will not be cached and computed with every access.
   */
  cache?: boolean;
  /**
   * specifies when a cached value will be cleared
   * if All cached value will be cleared afterAll
   */
  cacheScope?: Scopes;
}

/**
 * constructs a value
 */
export type Constructor<T> = () => T;
/**
 * cleans up a value
 */
export type Destructor<T> = (value: T) => void | Promise<void>;

/**
 * Representation of a Given value for testing
 */
export interface Given<T> {
  /**
   * the value of the given
   */
  readonly value: T;
  /**
   * define a new value for the given
   * @param constructor the constructor to create the new value
   * @param options options specifying the behavior of the new value
   * @returns the givin for method chaining.
   */
  define(constructor: Constructor<T>, options?: GivenOptions): this;
  /**
   * define a cleanup operation for constructed values,
   * @param destructor the cleanup code
   * @param scope the scope to run the cleanup at, by default All scope will be used
   */
  cleanUp(destructor: Destructor<T>, scope?: Scopes): this;
}

// global list of given objects representing
// a stack of value calls, used for re-entrant handling.
const givenStack: object[] = [];

export class GivenImpl<T> implements Given<T> {
  readonly #frameStack: Frame<T>[] = [emptyFrame];
  #currentFrameIndex: number = -1;
  #computing: boolean = false;

  get value(): T {
    // check for re-entrancy
    if (this.#computing && givenStack[0] !== this) {
      throw new LoopDetectionError();
    }
    // startup
    givenStack.unshift(this);
    const previousComputingValue = this.#computing;
    this.#computing = true;
    this.#currentFrameIndex++;
    try {
      return this.#frameStack[this.#currentFrameIndex].get();
    } finally {
      this.#currentFrameIndex--;
      givenStack.shift();
      this.#computing = previousComputingValue;
    }
  }

  #manageFrame(frame: Frame<T>, scope: 'Each' | 'All', immediate: boolean): void {
    begin(() => {
      this.#frameStack.unshift(frame);
    });
    if (immediate) {
      beforeTest(() => {
        // seed the cache
        frame.get();
      });
    }
    if (scope === 'Each') {
      afterTest(async () => {
        await frame.release();
      });
    }
    end(async () => {
      await this.#frameStack.shift()!.release();
    });
  }

  define(
    constructor: () => T,
    { cache = true, cacheScope = 'Each', immediate = false }: GivenOptions = {}
  ): this {
    const frame = cache ? new CacheFrame(constructor) : new DefineFrame(constructor);
    this.#manageFrame(frame, cacheScope, immediate);
    return this;
  }

  cleanUp(destructor: (value: T) => void | Promise<void>, scope: Scopes = 'All'): this {
    this.#manageFrame(new CleanUpFrame(this, destructor), scope, false);
    return this;
  }
}
