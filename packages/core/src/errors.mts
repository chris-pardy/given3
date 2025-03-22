import { Given } from "./given.mjs";

/**
 * Thrown when a given is accessed before a definition is provided
 */
export class NoDefinitionError extends Error {
  /**
   * The Given instance that caused the error
   */
  readonly given: Given<unknown>;

  constructor(given: Given<unknown>) {
    super(
      `No definition provided for given${given.name !== undefined ? ` '${given.name}'` : ""}`,
    );
    this.given = given;
  }
}

/**
 * Thrown when a given is accessed in a circular reference
 */
export class CircularReferenceError extends Error {
  /**
   * The Given instance that caused the error
   */
  readonly given: Given<unknown>;

  constructor(given: Given<unknown>) {
    super(
      `Circular reference detected for given${given.name !== undefined ? ` '${given.name}'` : ""}`,
    );
    this.given = given;
  }
}
