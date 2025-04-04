import { describe, it, beforeEach, expect, vi } from "vitest";
import { GivenConstructor, RegisterCleanupFunction } from "../given.mjs";
import { createGivenLibrary } from "../index.mjs";
import { TestingHooks } from "./testing-hooks.mjs";

describe("cleanup", () => {
  let given: GivenConstructor;
  let hooks: TestingHooks;
  let cleanup: RegisterCleanupFunction;

  beforeEach(() => {
    hooks = new TestingHooks();
    const { createGivenConstructor, cleanup: cleanupFn } =
      createGivenLibrary(hooks);
    given = createGivenConstructor();
    cleanup = cleanupFn;
  });

  it("when registered via a definition it should call the cleanup function after the test", async () => {
    expect.assertions(2);
    await hooks.suite(async () => {
      const cleanupFn = vi.fn();
      const v = given("value", (registerCleanup) => {
        registerCleanup(cleanupFn);
        return 1;
      });
      await hooks.test(() => {
        void v.value;
        expect(cleanupFn).not.toHaveBeenCalled();
      });
      expect(cleanupFn).toHaveBeenCalled();
    });
  });

  it("when the library function is called, it should call the cleanup function after the test", async () => {
    expect.assertions(2);
    await hooks.suite(async () => {
      const cleanupFn = vi.fn();
      const v = given("value", () => {
        cleanup(cleanupFn);
        return 1;
      });
      await hooks.test(() => {
        void v.value;
        expect(cleanupFn).not.toHaveBeenCalled();
      });
      expect(cleanupFn).toHaveBeenCalled();
    });
  });
});
