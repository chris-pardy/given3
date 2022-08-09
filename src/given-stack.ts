import { Given } from './given-types';

const stack: Given<unknown>[] = [];
const subscribers: ((event: PopEvent) => void)[] = [];

export interface PopEvent {
  previous: Given<unknown>;
  next: Given<unknown> | undefined;
  result: unknown;
  newStackDepth: number;
}

export const givenStack = {
  isCurrent(given: Given<unknown>): boolean {
    return stack[0] === given;
  },

  currentStackDepth(): number {
    return stack.length;
  },
  within<T>(given: Given<unknown>, run: () => T): T {
    stack.unshift(given);
    let result: T;
    try {
      result = run();
      return result;
    } finally {
      const previous = stack.shift();
      subscribers.forEach((sub) => {
        sub({
          previous: previous!,
          next: stack[0],
          result,
          newStackDepth: stack.length
        });
      });
    }
  },
  onPop(subsciber: (event: PopEvent) => void): () => void {
    const idx = subscribers.push(subsciber);
    return () => delete subscribers[idx];
  }
};
