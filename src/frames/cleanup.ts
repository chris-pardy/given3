import type { Frame } from './frame';
import type { Destructor, Given } from '../given-types';

export class CleanUpFrame<T> implements Frame<T> {
  readonly #given: Given<T>;
  readonly #destructor: Destructor<T>;
  readonly #cleanUpValues: T[] = [];

  constructor(given: Given<T>, destructor: Destructor<T>) {
    this.#given = given;
    this.#destructor = destructor;
  }

  get(_register: (value: T) => void): T {
    return this.#given.value;
  }

  async release(): Promise<void> {
    for (const value of this.#cleanUpValues) {
      await this.#destructor(value);
    }
    this.#cleanUpValues.splice(0, this.#cleanUpValues.length);
  }

  onRegister(value: T): void {
    this.#cleanUpValues.push(value);
  }
}
