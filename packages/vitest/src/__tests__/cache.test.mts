import { describe, it, expect, vi, afterAll } from "vitest";
import { given } from "../index.mjs";

describe("cache", () => {
  const definition = vi.fn(() => Math.random());

  const cached = given<number>("cached value");

  describe(
    "given the value is cached at each scope",
    { sequential: true },
    () => {
      cached.define(definition, { cache: "Each" });

      afterAll(() => {
        definition.mockClear();
      });

      it("should call the definition once for the first test", () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        cached.value;
        expect(definition).toHaveBeenCalledTimes(1);
      });

      it("should call the definition twice for the second test", () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        cached.value;
        expect(definition).toHaveBeenCalledTimes(2);
      });
    },
  );

  describe(
    "given the value is cached at all scope",
    { sequential: true },
    () => {
      cached.define(definition, { cache: "All" });

      afterAll(() => {
        definition.mockClear();
      });

      it("should call the definition once for the first test", () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        cached.value;
        expect(definition).toHaveBeenCalledTimes(1);
      });

      it("should call the definition once for the second test", () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        cached.value;
        expect(definition).toHaveBeenCalledTimes(1);
      });
    },
  );

  describe("given the value is not cached", { sequential: true }, () => {
    cached.define(definition, { cache: false });

    afterAll(() => {
      definition.mockClear();
    });

    it("should call the definition multiple times if used in a single test", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      cached.value;
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      cached.value;
      expect(definition).toHaveBeenCalledTimes(2);
    });
  });

  describe("smart caching", () => {
    const id = given<number>("id");
    const user = given(() => ({ id: id.value }));

    it("should reuse the user if the id doesn't change", () => {
      id.define(() => 5);
      const user1 = user.value;
      id.define(() => 5);
      const user2 = user.value;
      expect(user1).toBe(user2);
    });

    it("should create a new user if the id changes", () => {
      id.define(() => 5);
      const user1 = user.value;
      id.define(() => 6);
      const user2 = user.value;
      expect(user1).not.toBe(user2);
    });
  });
});
