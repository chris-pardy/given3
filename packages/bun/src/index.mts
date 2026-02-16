import { createGivenLibrary } from "@given3/core";
import { afterAll, afterEach, beforeAll, beforeEach } from "bun:test";

export type {
  Given,
  GivenDefinition,
  GivenOptions,
  GivenConstructor,
  GivenMiddleware,
  CleanupFunction,
} from "@given3/core";

export const { createGivenConstructor, cleanup } = createGivenLibrary({
  beforeEach,
  afterEach,
  afterAll,
  beforeAll,
});

export const given = createGivenConstructor();
