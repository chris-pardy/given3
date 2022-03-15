import type { Frame } from './frame';

export class DefineFrame<T> implements Frame<T> {
  readonly #construct: () => T;

  constructor(c: () => T) {
    this.#construct = c;
  }

  get(register: (value: T) => void): T {
    const v = this.#construct();
    register(v);
    return v;
  }

  async release(): Promise<void> {
    return;
  }

  onRegister(_value: T): void {
    return;
  }
}
