import { DefineFrame, CleanUpFrame, CacheFrame, EmptyFrame, SmartCacheFrame } from './frames';
import type { Frame } from './frames';
import type { Given, GivenOptions, Scopes } from './given-types';
import { afterTest, beforeTest, begin, end } from './test-hooks';
import { LoopDetectionError } from './errors';
import { AsyncLocalStorage } from 'async_hooks';

export class GivenImpl<T> implements Given<T> {
  static readonly #currentGivenStore = new AsyncLocalStorage<Given<unknown>>();

  readonly #frameStack: Frame<T>[] = [new EmptyFrame(this)];
  readonly #currentFrameStore = new AsyncLocalStorage<number>();

  get value(): T {
    return this.#currentFrameStore.run((this.#currentFrameStore.getStore() ?? -1) + 1, () => {
      const frame = this.#currentFrameStore.getStore()!;
      // check for re-entrancy
      if (frame > 0 && GivenImpl.#currentGivenStore.getStore() !== this) {
        throw new LoopDetectionError();
      }
      return GivenImpl.#currentGivenStore.run(this, () => this.#frameStack[frame].get());
    });
  }

  #manageFrame(frame: Frame<T>, scope: 'Each' | 'All', immediate: boolean): void {
    begin(() => {
      this.#frameStack.unshift(frame);
      frame.mount();
    });
    if (immediate) {
      beforeTest(() => {
        // seed the cache
        frame.get();
      });
    }
    if (scope === 'Each') {
      afterTest(async () => {
        await frame.release();
      });
    }
    end(async () => {
      const removedFrame = this.#frameStack.shift();
      removedFrame!.unmount();
      await removedFrame!.release();
    });
  }

  define(
    constructor: () => T,
    { cache = true, cacheScope = 'Each', immediate = false }: GivenOptions = {}
  ): this {
    const frame = cache
      ? cache === 'smart'
        ? new SmartCacheFrame(this, constructor)
        : new CacheFrame(this, constructor)
      : new DefineFrame(this, constructor);
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
