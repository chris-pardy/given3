import { given } from "../index.mjs";
import { describe, it, expect } from "vitest";

describe("errors", () => {
  const value = given<number>("value");

  it("throws an error if the definition hasn't been set", () => {
    expect(() => value.value).toThrow("No definition");
  });

  it("throws an error if the definitions are circular", () => {
    const secondValue = given(() => value.value + 1);
    value.define(() => secondValue.value - 1);
    expect(() => value.value).toThrow("Circular");
  });
});
