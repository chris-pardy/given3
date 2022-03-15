import type { Frame } from './frame';
import { emptyFrame } from './empty';
import { LoopDetectionError } from '../errors';
import type { Given } from '../given';

// global list of given objects representing
// a stack of value calls, used for re-entrant handling.
const givenStack: object[] = [];

export class DefineFrame<T> implements Frame<T> {
  readonly #parent: Given<T>;
  readonly #construct: () => T;
  #computing: boolean = false;

  public previousFrame: Frame<T> = emptyFrame;

  constructor(parent: Given<T>, c: () => T) {
    this.#parent = parent;
    this.#construct = c;
  }

  get(): T {
    if (this.#computing) {
      if (givenStack[0] === this.#parent) {
        // use the previousFrame value
        return this.previousFrame.get();
      } else {
        throw new LoopDetectionError();
      }
    }
    this.#computing = true;
    givenStack.unshift(this.#parent);
    try {
      return this.#construct();
    } finally {
      this.#computing = false;
      givenStack.shift();
    }
  }

  async release(): Promise<void> {
    return;
  }
}
