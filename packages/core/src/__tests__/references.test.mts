import { beforeEach, describe, expect, it } from "vitest";
import { GivenConstructor } from "../given.mjs";
import { createGivenLibrary } from "../index.mjs";
import { TestingHooks } from "./testing-hooks.mjs";

describe("using references for act, arrange, assert", () => {
  let given: GivenConstructor;
  let hooks: TestingHooks;

  beforeEach(() => {
    hooks = new TestingHooks();
    given = createGivenLibrary(hooks).createGivenConstructor();
  });

  it("should be able to use references to create an act, arrange, assert flow", async () => {
    await hooks.suite(async () => {
      const numerator = given<number>("input1");
      const denominator = given<number>("input2");

      // act
      const quotient = given(() => numerator.value / denominator.value);

      await hooks.suite(async () => {
        // arrange: given the denominator is 1
        denominator.define(() => 1);

        // could be done with a it.each or loop to test multiple numerators
        await hooks.test(() => {
          // arrange
          numerator.define(() => 67);
          // assert
          expect(quotient.value).toBe(numerator.value);
        });
      });
    });
  });

  it("should be able to use suites and smart caching to test edge cases", async () => {
    expect.assertions(3);
    await hooks.suite(async () => {
      const numerator = given<number>("input1", () => 7);
      const denominator = given<number>("input2", () => 1);

      const quotient = given(() => numerator.value / denominator.value, {
        cache: "All",
      });

      await hooks.test(() => {
        expect(quotient.value).toBeLessThan(Infinity);
      });

      await hooks.suite(async () => {
        denominator.define(() => 0);
        await hooks.test(() => {
          expect(quotient.value).toBe(Infinity);
        });
      });

      await hooks.test(() => {
        expect(quotient.value).toBeLessThan(Infinity);
      });
    });
  });
});
