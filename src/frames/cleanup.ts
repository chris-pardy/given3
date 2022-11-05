import { Frame } from './frame';
import type { Destructor, Given } from '../given-types';

export class CleanUpFrame<T> extends Frame<T> {
  readonly #destructor: Destructor<T>;
  readonly #cleanUpValues: Set<T> = new Set();
  #popUnsubscribe?: () => void;

  constructor(given: Given<T>, destructor: Destructor<T>) {
    super(given);
    this.#destructor = destructor;
  }

  protected compute(): T {
    return this.parent.value;
  }

  async release(): Promise<void> {
    for (const value of this.#cleanUpValues) {
      await this.#destructor(value);
    }
    this.#cleanUpValues.clear();
  }

  mount(): void {
    this.unmount();
    this.#popUnsubscribe = this.onPop(({ previous, result }) => {
      if (previous.parent === this.parent) {
        this.#cleanUpValues.add(result as T);
      }
    });
  }

  unmount(): void {
    if (this.#popUnsubscribe) {
      this.#popUnsubscribe();
    }
    this.#popUnsubscribe = undefined;
  }
}
