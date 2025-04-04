import { describe, it, beforeEach, expect, vi } from "vitest";
import { GivenConstructor } from "../given.mjs";
import { createGivenLibrary } from "../index.mjs";
import { TestingHooks } from "./testing-hooks.mjs";

describe("caching", () => {
  let given: GivenConstructor;
  let hooks: TestingHooks;

  beforeEach(() => {
    hooks = new TestingHooks();
    given = createGivenLibrary(hooks).createGivenConstructor();
  });

  it.each(["All", "Each"] as const)(
    "given a cache of %s the value should only be computed once per test",
    async (cache) => {
      const definition = vi.fn(() => 1);
      await hooks.suite(async () => {
        const v = given("value", definition, { cache });
        await hooks.test(() => {
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          v.value;
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          v.value;
          expect(definition).toHaveBeenCalledTimes(1);
        });
      });
    },
  );

  it("given a cache of false the value should be computed every time", async () => {
    const definition = vi.fn(() => 1);
    await hooks.suite(async () => {
      const v = given("value", definition, { cache: false });
      await hooks.test(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        v.value;
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        v.value;
        expect(definition).toHaveBeenCalledTimes(2);
      });
    });
  });

  it("given a cache of All the value should be computed once per suite", async () => {
    const definition = vi.fn(() => 1);
    await hooks.suite(async () => {
      const v = given("value", definition, { cache: "All" });
      await hooks.test(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        v.value;
      });
      await hooks.test(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        v.value;
      });
      expect(definition).toHaveBeenCalledTimes(1);
    });
  });

  it.each(["Each", false] as const)(
    "given a cache of %s the value should be computed for each test",
    async (cache) => {
      const definition = vi.fn(() => 1);
      await hooks.suite(async () => {
        const v = given("value", definition, { cache });
        await hooks.test(() => {
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          v.value;
        });
        await hooks.test(() => {
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          v.value;
        });
        expect(definition).toHaveBeenCalledTimes(2);
      });
    },
  );

  describe("smart caching", () => {
    it("should not recompute the value if a dependency does'nt change", async () => {
      const dependency = given<number>("dependency");
      const definition = vi.fn(() => dependency.value + 1);
      await hooks.suite(async () => {
        const v = given("value", definition, { cache: "Each" });
        dependency.define(() => 1);
        await hooks.test(() => {
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          v.value;
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          v.value;
          expect(definition).toHaveBeenCalledTimes(1);
        });
      });
    });

    it("should recompute the value if a dependency of the value changes", async () => {
      const dependency = given<number>("dependency");
      const definition = vi.fn(() => dependency.value + 1);
      await hooks.suite(async () => {
        const v = given("value", definition, { cache: "Each" });
        dependency.define(() => 1);
        await hooks.test(() => {
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          v.value;
          dependency.define(() => 2);
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          v.value;
          expect(definition).toHaveBeenCalledTimes(2);
        });
      });
    });

    it("should not recompute the value if a dependency returns to a previous value", async () => {
      const dependency = given<number>("dependency");
      const definition = vi.fn(() => dependency.value + 1);
      await hooks.suite(async () => {
        const v = given("value", definition, { cache: "Each" });
        dependency.define(() => 1);
        await hooks.test(() => {
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          v.value;
          dependency.define(() => 2);
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          v.value;
          dependency.define(() => 1);
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          v.value;
          expect(definition).toHaveBeenCalledTimes(2);
        });
      });
    });

    it("caching uses === to check for changes", async () => {
      const dependency = given<unknown>("dependency");
      const definition = vi.fn(() => `${dependency.value}`);
      await hooks.suite(async () => {
        const v = given("value", definition, { cache: "Each" });
        dependency.define(() => ({}), { cache: false }); // disable caching and return a new object every time.
        await hooks.test(() => {
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          v.value;
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          v.value;
          expect(definition).toHaveBeenCalledTimes(2);
        });
      });
    });

    it("value checking reduces unnecessary calls", async () => {
      const dependencyDefinition = vi.fn(() => 1);
      await hooks.suite(async () => {
        const dependency = given("dependency", dependencyDefinition, {
          cache: false,
        });
        const v = given("value", () => dependency.value + 1, { cache: "Each" });
        await hooks.test(() => {
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          v.value;
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          v.value;
          // called for each check
          expect(dependencyDefinition).toHaveBeenCalledTimes(2);
        });
      });
    });
  });
});
