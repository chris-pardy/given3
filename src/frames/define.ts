import { Frame } from './frame';
import type { Given } from '../given-types';

export class DefineFrame<T> extends Frame<T> {
  readonly #construct: () => T;

  constructor(given: Given<T>, c: () => T) {
    super(given);
    this.#construct = c;
  }

  protected compute(): T {
    const v = this.#construct();
    return v;
  }

  async release(): Promise<void> {
    return;
  }

  onRegister(_value: T): void {
    return;
  }
}
