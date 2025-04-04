import { describe, it, beforeEach, expect } from "vitest";
import { GivenConstructor } from "../given.mjs";
import { createGivenLibrary } from "../index.mjs";
import { TestingHooks } from "./testing-hooks.mjs";
import { CircularReferenceError, NoDefinitionError } from "../errors.mjs";

describe("refinement", () => {
  let given: GivenConstructor;
  let hooks: TestingHooks;

  beforeEach(() => {
    hooks = new TestingHooks();
    given = createGivenLibrary(hooks).createGivenConstructor();
  });

  it("when a definition references the same given the previous definition is used", async () => {
    await hooks.suite(async () => {
      const v = given("value", () => 1);
      v.define(() => v.value + 1);
      await hooks.test(() => {
        expect(v.value).toBe(2);
      });
    });
  });

  it("when a definition uses this it is the given instance", async () => {
    await hooks.suite(async () => {
      const v = given("value", () => 1);
      v.define(function () {
        return this.value + 1;
      });
      await hooks.test(() => {
        expect(v.value).toBe(2);
      });
    });
  });

  it("when a definition references itself but is the first definition an error is thrown", async () => {
    await hooks.suite(async () => {
      const v = given<number>("value");
      v.define(() => v.value + 1);
      await hooks.test(() => {
        expect(() => v.value).toThrow(NoDefinitionError);
      });
    });
  });

  it("when an async definition references itself after a new definition has been added to the stack the previous definition is used", async () => {
    await hooks.suite(async () => {
      const v = given("value", async () => 1);
      v.define(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return (await v.value) + 1;
      });

      await hooks.test(async () => {
        const r = v.value;
        // pushing a new definition before the previous one has referenced itself
        v.define(async () => 3);
        expect(await r).toBe(2);
      });
    });
  });

  it("when definitions circularly reference each other an error is thrown", async () => {
    await hooks.suite(async () => {
      const v = given<number>("value");
      const other = given("other", () => v.value + 1);
      v.define(() => other.value - 1);
      await hooks.test(() => {
        expect(() => v.value).toThrow(CircularReferenceError);
      });
    });
  });
});
