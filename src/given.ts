import { DefineFrame, CleanUpFrame, CacheFrame, emptyFrame } from './frames';
import type { Frame } from './frames';
import type { Given, GivenOptions, Scopes } from './given-types';
import { afterTest, beforeTest, begin, end } from './test-hooks';
import { LoopDetectionError } from './errors';
import { givenStack } from './given-stack';

export class GivenImpl<T> implements Given<T> {
  readonly #frameStack: Frame<T>[] = [emptyFrame];
  #currentFrameIndex: number = -1;
  #computing: boolean = false;

  #registerAll(value: T): void {
    for (const frame of this.#frameStack) {
      frame.onRegister(value);
    }
  }

  get value(): T {
    // check for re-entrancy
    if (this.#computing && !givenStack.isCurrent(this)) {
      throw new LoopDetectionError();
    }
    // startup
    return givenStack.within(this, () => {
      const previousComputingValue = this.#computing;
      this.#computing = true;
      this.#currentFrameIndex++;
      try {
        return this.#frameStack[this.#currentFrameIndex].get(this.#registerAll.bind(this));
      } finally {
        this.#currentFrameIndex--;
        this.#computing = previousComputingValue;
      }
    });
  }

  #manageFrame(frame: Frame<T>, scope: 'Each' | 'All', immediate: boolean): void {
    begin(() => {
      this.#frameStack.unshift(frame);
    });
    if (immediate) {
      beforeTest(() => {
        // seed the cache
        frame.get(this.#registerAll.bind(this));
      });
    }
    if (scope === 'Each') {
      afterTest(async () => {
        await frame.release();
      });
    }
    end(async () => {
      await this.#frameStack.shift()!.release();
    });
  }

  define(
    constructor: () => T,
    { cache = true, cacheScope = 'Each', immediate = false }: GivenOptions = {}
  ): this {
    const defineFrame = new DefineFrame(constructor);
    const frame = cache ? new CacheFrame(defineFrame) : defineFrame;
    this.#manageFrame(frame, cacheScope, immediate);
    return this;
  }

  refine(constructor: (previousValue: T) => T | void, options?: GivenOptions): this {
    return this.define(() => {
      const previousValue = this.value;
      const nextValue = constructor(previousValue);
      return nextValue !== undefined ? nextValue : previousValue;
    }, options);
  }

  cleanUp(destructor: (value: T) => void | Promise<void>, scope: Scopes = 'All'): this {
    this.#manageFrame(new CleanUpFrame(this, destructor), scope, false);
    return this;
  }
}
