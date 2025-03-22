import { given } from "../index.mjs";
import { describe, it, expect } from "vitest";

describe("async smart caching", () => {
  function waitFor(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  const eventuallyNumber = given(async () => {
    await waitFor(100);
    return 5;
  });
  const eventuallyString = given(async () => {
    await waitFor(100);
    const num = await eventuallyNumber.value;
    return `number: ${num}`;
  });

  it("should be able to use the value", async () => {
    const str = await eventuallyString.value;
    expect(str).toBe("number: 5");
  });

  it("caching only considers values that have been computed", async () => {
    const str1 = eventuallyString.value;
    eventuallyNumber.define(async () => 6);
    const str2 = eventuallyString.value;
    expect(str1).toBe(str2);
  });

  it("after a value is computed it's considered in the cache", async () => {
    const str1 = eventuallyString.value;
    await str1;
    eventuallyNumber.define(async () => 6);
    const str2 = eventuallyString.value;
    expect(str1).not.toBe(str2);
  });
});
