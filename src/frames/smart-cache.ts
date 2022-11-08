import { DefineFrame } from './define';
import type { Given } from '../given-types';

export class SmartCacheFrame<T> extends DefineFrame<T> {
  #cache: { value: T; dependsOn: { given: Given<unknown>; result: unknown }[] }[] = [];

  constructor(given: Given<T>, c: () => T) {
    super(given, c);
  }

  compute(): T {
    for (const { value, dependsOn } of this.#cache) {
      if (dependsOn.every(({ given, result }) => given.value === result)) {
        return value;
      }
    }

    const dependsOn: { given: Given<unknown>; result: unknown }[] = [];
    const unsub = this.onPop(({ previous, next, result }) => {
      if (next === this) {
        dependsOn.push({ given: previous.parent, result });
      }
    });
    try {
      const v = super.compute();
      this.#cache.unshift({ value: v, dependsOn });
      return v;
    } finally {
      unsub();
    }
  }

  async release(): Promise<void> {
    this.#cache = [];
    super.release();
  }
}
