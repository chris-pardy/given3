import type { Frame } from './frame';
import type { Given } from '../given-types';
import { givenStack } from '../given-stack';

export class SmartCacheFrame<T> implements Frame<T> {
  readonly #given: Given<T>;
  readonly #definition: Frame<T>;
  #cache: { value: T; dependsOn: { given: Given<unknown>; result: unknown }[] }[] = [];

  constructor(given: Given<T>, previous: Frame<T>) {
    this.#given = given;
    this.#definition = previous;
  }

  get(register: (value: T) => void): T {
    for (const { value, dependsOn } of this.#cache) {
      if (dependsOn.every(({ given, result }) => given.value === result)) {
        return value;
      }
    }

    const currentStackDepth = givenStack.currentStackDepth();
    const dependsOn: { given: Given<unknown>; result: unknown }[] = [];
    const unsub = givenStack.onPop(({ previous, next, result, newStackDepth }) => {
      if (next === this.#given && newStackDepth === currentStackDepth) {
        dependsOn.push({ given: previous, result });
      }
    });
    try {
      const v = this.#definition.get(register);
      this.#cache.unshift({ value: v, dependsOn });
      return v;
    } finally {
      unsub();
    }
  }

  async release(): Promise<void> {
    this.#cache = [];
    this.#definition.release();
  }

  onRegister(value: T): void {
    this.#definition.onRegister(value);
  }
}
