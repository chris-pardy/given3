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
   * if the cache value is set to 'smart' the cache will be cleared if any givens this value depends on change.
   */
  cache?: boolean | 'smart';
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
   * @returns the given for method chaining.
   */
  define(constructor: Constructor<T>, options?: GivenOptions): this;
  /**
   * refine the value for the given based on the previously defined value.
   * The supplied refiner function may return a new / modified value or
   * mutate the value in place and return void.
   * @param refiner the function that mutates the previous value.
   * @param options options specifying the behavior of the new value
   * @returns the given for method chaining.
   */
  refine(refiner: (previousValue: T) => T | void, options?: GivenOptions): this;
  /**
   * define a cleanup operation for constructed values,
   * @param destructor the cleanup code
   * @param scope the scope to run the cleanup at, by default All scope will be used
   * @returns the given for method chaining.
   */
  cleanUp(destructor: Destructor<T>, scope?: Scopes): this;
}
