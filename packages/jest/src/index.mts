import { createGivenConstructor as createGivenConstructorCore } from "@given3/core";
import { afterAll, afterEach, beforeAll, beforeEach } from "@jest/globals";

export type {
  Given,
  GivenDefinition,
  GivenOptions,
  GivenConstructor,
  GivenMiddleware,
} from "@given3/core";

export const createGivenConstructor = createGivenConstructorCore.bind(null, {
  beforeEach,
  afterEach,
  afterAll,
  beforeAll,
});

export const given = createGivenConstructor();
