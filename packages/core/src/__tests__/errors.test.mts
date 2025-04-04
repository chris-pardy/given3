import { describe, it, expect } from "vitest";
import { NoDefinitionError, CircularReferenceError } from "../errors.mjs";
import { type Given } from "../given.mjs";

describe("NoDefinitionError", () => {
  it("should be an instance of Error", () => {
    const error = new NoDefinitionError({} as Given<unknown>);
    expect(error).toBeInstanceOf(Error);
  });
  it("should have a message", () => {
    const error = new NoDefinitionError({} as Given<unknown>);
    expect(error.message).toBe("No definition provided for given");
  });

  it("should have the name of the given in the message", () => {
    const error = new NoDefinitionError({ name: "test" } as Given<unknown>);
    expect(error.message).toBe("No definition provided for given 'test'");
  });
});

describe("CircularReferenceError", () => {
  it("should be an instance of Error", () => {
    const error = new CircularReferenceError({} as Given<unknown>);
    expect(error).toBeInstanceOf(Error);
  });
  it("should have a message", () => {
    const error = new CircularReferenceError({} as Given<unknown>);
    expect(error.message).toBe("Circular reference detected for given");
  });

  it("should have the name of the given in the message", () => {
    const error = new CircularReferenceError({
      name: "test",
    } as Given<unknown>);
    expect(error.message).toBe("Circular reference detected for given 'test'");
  });
});
