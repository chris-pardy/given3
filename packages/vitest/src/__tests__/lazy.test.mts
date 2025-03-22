import { describe, it, expect, vi, beforeEach } from "vitest";
import { given } from "../index.mjs";

describe("lazy", () => {
  const definition = vi.fn(() => "hello");

  beforeEach(() => {
    definition.mockClear();
  });

  const lazy = given(definition);

  it("when the value is not accessed the definition is not called", () => {
    expect(definition).not.toHaveBeenCalled();
  });

  it("when the value is accessed the definition is called", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    lazy.value;
    expect(definition).toHaveBeenCalled();
  });
});
