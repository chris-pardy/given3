import type { Frame } from './frame';

export class CacheFrame<T> implements Frame<T> {
  readonly #definition: Frame<T>;
  #cache?: T = undefined;
  #isCached: boolean = false;

  constructor(previous: Frame<T>) {
    this.#definition = previous;
  }

  get(register: (value: T) => void): T {
    if (this.#isCached) {
      return this.#cache!;
    }
    const v = this.#definition.get(register);
    this.#cache = v;
    this.#isCached = true;
    return v;
  }

  async release(): Promise<void> {
    this.#cache = undefined;
    this.#isCached = false;
    this.#definition.release();
  }

  onRegister(value: T): void {
    this.#definition.onRegister(value);
  }
}
