import type { Given, Constructor, GivenOptions } from './given-types';
import { GivenImpl } from './given';

export interface GivenConstructor {
  /**
   * create a Given that will throw if the value is accessed. The given can be defined later.
   */
  <T>(): Given<T>;
  /**
   * create a Given with the provided constructor
   * @param constructor the default constructor for the Given
   * @param options options to specify Given behavior
   */
  <T>(constructor: Constructor<T>, options?: GivenOptions): Given<T>;
}

/**
 * Middleware enhances each Given on construction.
 */
export interface Middleware {
  construct<T>(given: Given<T>): Given<T>;
}

/**
 * Compose (optional) middleware to create a Given constructor,
 */
export const createConstructor = (...middleWare: Middleware[]): GivenConstructor => {
  return <T>(constructor?: Constructor<T>, options?: GivenOptions) => {
    const g = middleWare.reduceRight(
      (g: Given<T>, m: Middleware) => m.construct(g),
      new GivenImpl<T>()
    );
    if (constructor) {
      g.define(constructor, options);
    }
    return g;
  };
};

/**
 * create a new Given
 */
export const given = createConstructor();
