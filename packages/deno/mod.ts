import { createGivenLibrary } from "./_core/index.ts";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
} from "@std/testing/bdd";

export type {
  Given,
  GivenDefinition,
  GivenOptions,
  GivenConstructor,
  GivenMiddleware,
  CleanupFunction,
} from "./_core/index.ts";

export const { createGivenConstructor, cleanup } = createGivenLibrary({
  beforeEach,
  afterEach,
  afterAll,
  beforeAll,
});

export const given = createGivenConstructor();
