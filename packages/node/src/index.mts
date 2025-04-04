import { createGivenLibrary } from "@given3/core";
import { after, afterEach, before, beforeEach } from "node:test";

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
  afterAll: after,
  beforeAll: before,
});

export const given = createGivenConstructor();
