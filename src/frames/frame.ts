import { AsyncLocalStorage } from 'async_hooks';
import type { Given } from '../given-types';
export interface PopEvent {
  previous: Frame<unknown>;
  next: Frame<unknown> | undefined;
  result: unknown;
}

export abstract class Frame<T> {
  static readonly #frameStackStorage = new AsyncLocalStorage<Frame<unknown>>();
  static readonly #subscribers: ((event: PopEvent) => void)[] = [];

  readonly parent: Given<T>;

  constructor(parent: Given<T>) {
    this.parent = parent;
  }

  get(): T {
    const next = Frame.#frameStackStorage.getStore();
    const previous = this as Frame<unknown>;
    let r: T;
    try {
      r = Frame.#frameStackStorage.run(previous, () => this.compute());
      return r;
    } finally {
      const event = { previous, next, result: r! };
      Frame.#subscribers.forEach((sub) => sub(event));
    }
  }

  public onPop(subscriber: (event: PopEvent) => void): () => void {
    const idx = Frame.#subscribers.push(subscriber);
    return () => delete Frame.#subscribers[idx];
  }

  protected abstract compute(): T;

  abstract release(): Promise<void>;

  mount(): void {
    return;
  }

  unmount(): void {
    return;
  }
}
