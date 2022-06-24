type DeepPartialObject<T> = T extends object
  ? {
      [TKey in keyof T]?: DeepPartial<T[TKey]>;
    }
  : never;

type DeepPartialArray<T> = T extends Array<infer TValue>
  ? {
      [index: number]: DeepPartial<TValue>;
    }
  : never;

type MergeFunction<T> = (input: T) => T;

export type DeepPartial<T> = T | DeepPartialObject<T> | DeepPartialArray<T> | MergeFunction<T>;

export function merge<T>(target: T, partial: DeepPartial<T>): T {
  if (typeof partial === 'object' && partial !== null) {
    if (Array.isArray(target)) {
      return target.map((value, index) => {
        if (index in partial) {
          return merge(value, partial[index as keyof typeof partial]);
        }
        return value;
      }) as unknown as T;
    }
    return Object.fromEntries(
      Object.entries(target).map(([key, value]) => {
        if (key in partial) {
          return [key, merge(value, partial[key as keyof typeof partial])];
        }
        return [key, value];
      })
    ) as unknown as T;
  }
  if (typeof partial === 'function') {
    return (partial as MergeFunction<T>)(target);
  }
  return partial as T;
}
