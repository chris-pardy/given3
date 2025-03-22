import { given } from "../index.mjs";
import { describe, it, expect, vi } from "vitest";

describe("cleanup", () => {
  describe("when the value is read", { sequential: true }, () => {
    const cleanup = vi.fn();

    const value = given((registerCleanup) => {
      registerCleanup(() => cleanup());
      return 1;
    });

    it("the cleanup hasn't been called when the value is read", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      value.value;
      expect(cleanup).not.toHaveBeenCalled();
    });

    it("the cleanup is called after the value is read", () => {
      expect(cleanup).toHaveBeenCalledTimes(1);
    });
  });

  describe("when the value is a disposable", { sequential: true }, () => {
    const cleanup = vi.fn();

    const value = given(() => {
      return {
        [Symbol.dispose]: cleanup,
        count: 1,
      };
    });

    it("the cleanup function is not called when the value is read", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      value.value;
      expect(cleanup).not.toHaveBeenCalled();
    });

    it("the cleanup function is called when the value is disposed", () => {
      expect(cleanup).toHaveBeenCalledTimes(1);
    });
  });
});
