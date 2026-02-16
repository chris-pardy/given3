import { given, cleanup } from "../index.mts";
import { describe, it } from "node:test";
import assert from "node:assert";

describe("given3 node integration", () => {
  describe("basic lazy values", () => {
    const name = given(() => "John");
    const age = given(() => 30);

    it("should lazily initialize values", () => {
      assert.strictEqual(name.value, "John");
      assert.strictEqual(age.value, 30);
    });
  });

  describe("caching", () => {
    const obj = given(() => ({ key: "value" }));

    it("should return the same instance on multiple accesses", () => {
      const first = obj.value;
      const second = obj.value;
      assert.strictEqual(first, second);
    });
  });

  describe("dependency tracking", () => {
    const name = given(() => "John");
    const greeting = given(() => `Hello, ${name.value}!`);

    it("should recompute when dependency changes", () => {
      assert.strictEqual(greeting.value, "Hello, John!");
      name.define(() => "Jane");
      assert.strictEqual(greeting.value, "Hello, Jane!");
    });
  });

  describe("refinement in nested describes", () => {
    const name = given(() => "John");
    const greeting = given(() => `Hello, ${name.value}!`);

    it("should use the default value", () => {
      assert.strictEqual(greeting.value, "Hello, John!");
    });

    describe("when name is redefined", () => {
      name.define(() => "Jane");

      it("should use the refined value", () => {
        assert.strictEqual(greeting.value, "Hello, Jane!");
      });
    });

    it("should still use the original value in the outer scope", () => {
      assert.strictEqual(greeting.value, "Hello, John!");
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
      assert.strictEqual(resource.value, "resource");
      assert.strictEqual(cleanedUp, false);
    });

    it("should have cleaned up from previous test", () => {
      assert.strictEqual(cleanedUp, true);
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
      assert.strictEqual(resource.value, "resource");
      assert.strictEqual(cleanedUp, false);
    });

    it("should have cleaned up from previous test", () => {
      assert.strictEqual(cleanedUp, true);
    });
  });
});
