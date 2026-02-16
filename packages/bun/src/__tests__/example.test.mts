import { given, cleanup } from "../index.mjs";
import { describe, it, expect } from "bun:test";

describe("given3 bun integration", () => {
  describe("basic lazy values", () => {
    const name = given(() => "John");
    const age = given(() => 30);

    it("should lazily initialize values", () => {
      expect(name.value).toBe("John");
      expect(age.value).toBe(30);
    });
  });

  describe("caching", () => {
    const obj = given(() => ({ key: "value" }));

    it("should return the same instance on multiple accesses", () => {
      const first = obj.value;
      const second = obj.value;
      expect(first).toBe(second);
    });
  });

  describe("dependency tracking", () => {
    const name = given(() => "John");
    const greeting = given(() => `Hello, ${name.value}!`);

    it("should recompute when dependency changes", () => {
      expect(greeting.value).toBe("Hello, John!");
      name.define(() => "Jane");
      expect(greeting.value).toBe("Hello, Jane!");
    });
  });

  describe("refinement in nested describes", () => {
    const name = given(() => "John");
    const greeting = given(() => `Hello, ${name.value}!`);

    it("should use the default value", () => {
      expect(greeting.value).toBe("Hello, John!");
    });

    describe("when name is redefined", () => {
      name.define(() => "Jane");

      it("should use the refined value", () => {
        expect(greeting.value).toBe("Hello, Jane!");
      });
    });

    it("should still use the original value in the outer scope", () => {
      expect(greeting.value).toBe("Hello, John!");
    });
  });

  describe("cleanup", () => {
    let cleanedUp = false;

    const resource = given((cleanupFn) => {
      cleanupFn(() => {
        cleanedUp = true;
      });
      return "resource";
    });

    it("should access the resource", () => {
      expect(resource.value).toBe("resource");
      expect(cleanedUp).toBe(false);
    });

    it("should have cleaned up from previous test", () => {
      expect(cleanedUp).toBe(true);
    });
  });

  describe("cleanup via cleanup function", () => {
    let cleanedUp = false;

    const resource = given(() => {
      cleanup(() => {
        cleanedUp = true;
      });
      return "resource";
    });

    it("should access the resource", () => {
      expect(resource.value).toBe("resource");
      expect(cleanedUp).toBe(false);
    });

    it("should have cleaned up from previous test", () => {
      expect(cleanedUp).toBe(true);
    });
  });
});
