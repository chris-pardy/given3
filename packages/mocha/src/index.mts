import { createGivenLibrary } from "@given3/core";
import { after, afterEach, before, beforeEach } from "mocha";

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
