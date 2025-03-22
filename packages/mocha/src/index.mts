import { createGivenConstructor as createGivenConstructorCore } from "@given3/core";
import { after, afterEach, before, beforeEach } from "mocha";

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
  afterAll: after,
  beforeAll: before,
});

export const given = createGivenConstructor();
