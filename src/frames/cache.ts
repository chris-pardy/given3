import { DefineFrame } from './define';
import { Given } from '../given-types';

export class CacheFrame<T> extends DefineFrame<T> {
  #cache?: T = undefined;
  #isCached: boolean = false;

  constructor(given: Given<T>, c: () => T) {
    super(given, c);
  }

  protected compute(): T {
    if (this.#isCached) {
      return this.#cache!;
    }
    const v = super.compute();
    this.#cache = v;
    this.#isCached = true;
    return v;
  }

  async release(): Promise<void> {
    this.#cache = undefined;
    this.#isCached = false;
    super.release();
  }
}
