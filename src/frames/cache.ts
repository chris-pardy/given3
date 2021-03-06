import { DefineFrame } from './define';

export class CacheFrame<T> extends DefineFrame<T> {
  #cache?: T = undefined;
  #isCached: boolean = false;

  get(register: (value: T) => void): T {
    if (this.#isCached) {
      return this.#cache!;
    }
    const v = super.get(register);
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
