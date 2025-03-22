import { given } from "../index.mjs";
import { describe, it, expect } from "vitest";

describe("values", () => {
  const value = given<number>("value");

  it("can be defined in a test", () => {
    value.define(() => 5);
    expect(value.value).toBe(5);
  });

  describe("referencing other values", () => {
    value.define(() => 6);
    const oneMore = given(() => value.value + 1);

    it("should be able to use the other value", () => {
      expect(oneMore.value).toBe(7);
    });
  });

  describe("referencing itself", () => {
    value.define(() => 7).define(() => value.value + 1);

    it("should be able to use the reference itself", () => {
      expect(value.value).toBe(8);
    });
  });
});
