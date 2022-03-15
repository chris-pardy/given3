import type { Frame } from './frame';
import { emptyFrame } from './empty';
import type { Destructor } from '../given';

export class CleanUpFrame<T> implements Frame<T> {
  readonly #destructor: Destructor<T>;
  readonly #cleanUpValues: T[] = [];
  public previousFrame: Frame<T> = emptyFrame;

  constructor(destructor: Destructor<T>) {
    this.#destructor = destructor;
  }

  get(): T {
    const v = this.previousFrame.get();
    this.#cleanUpValues.push(v);
    return v;
  }

  async release(): Promise<void> {
    for (const value of this.#cleanUpValues) {
      await this.#destructor(value);
    }
    this.#cleanUpValues.splice(0, this.#cleanUpValues.length);
  }
}
