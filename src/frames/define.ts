import type { Frame } from './frame';

export class DefineFrame<T> implements Frame<T> {
  readonly #construct: () => T;

  constructor(c: () => T) {
    this.#construct = c;
  }

  get(): T {
    return this.#construct();
  }

  async release(): Promise<void> {
    return;
  }
}
