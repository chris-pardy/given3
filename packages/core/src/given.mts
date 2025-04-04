/**
 * A function that will be called to cleanup a Given value
 */
export type CleanupFunction = () => void | Promise<void>;

/**
 * A function that will be called to register a cleanup function
 */
export type RegisterCleanupFunction = (
  cleanup: CleanupFunction | Disposable | AsyncDisposable,
) => void;

/**
 * A function that defines how to create a value for a Given instance
 * @template T The type of value to be created
 * @param registerCleanup A callback function that will be called to register a cleanup function
 * @returns The created value of type T
 */
export type GivenDefinition<T> = (
  this: Given<T>,
  registerCleanup: RegisterCleanupFunction,
) => T;

/**
 * Configuration options for a Given instance
 */
export type GivenOptions = {
  /**
   * The scope of the Given instance cache
   * - 'Each': Create a new value for each test
   * - 'All': Create one value shared across all tests in a suite
   * - false: Do not cache the value
   * @default 'Each'
   */
  cache?: "Each" | "All" | false;
};

/**
 * Represents a test fixture that can provide a value of type T
 * @template T The type of value this Given instance provides
 */
export interface Given<T> {
  /**
   * Optional name for this Given instance
   */
  readonly name?: string;

  /**
   * The current value of this Given instance
   */
  readonly value: T;

  /**
   * Defines how this Given instance's value should be created
   * @param definition A function that returns the value and accepts a cleanup callback
   * @param options Configuration options for caching and scope
   * @returns This Given instance for chaining
   */
  define(definition: GivenDefinition<T>, options?: GivenOptions): this;
}

/**
 * A constructor function for creating Given instances
 */
export interface GivenConstructor {
  <T>(
    name?: string,
    definition?: GivenDefinition<T>,
    options?: GivenOptions,
  ): Given<T>;
  <T>(definition: GivenDefinition<T>, options?: GivenOptions): Given<T>;
}

/**
 * Test hooks passed in by the test library specific library
 */
export interface TestHooks {
  beforeAll(hookFn: () => void): void;
  beforeEach(hookFn: () => void): void;
  afterEach(hookFn: () => void | Promise<void>): void;
  afterAll(hookFn: () => void | Promise<void>): void;
}
