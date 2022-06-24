import { DeepPartial, merge } from './merge-deep';

interface UsingListFactory<TResult> {
  (result: TResult[]): TResult[];
  /**
   * Refine the length of the given array by adding or removing items.
   */
  of(length: number | (() => number)): (result: TResult[]) => TResult[];
}

type UsingFactory<TResult, TTraits extends string> = {
  [TTrait in TTraits]: UsingFactory<TResult, TTraits>;
} & {
  /**
   * Capture the series of refinements as a trait;
   */
  as<TTrait extends string>(trait: TTrait): Factory<TResult, TTraits | TTrait>;
  /**
   * Modify the result of the factory by using a deep merge algorithm on the given partial object
   */
  merge(partial: DeepPartial<TResult>): UsingFactory<TResult, TTraits>;
  /**
   * Refine a list of items
   */
  list: UsingListFactory<TResult>;
} & ((result: TResult) => TResult);

interface ListFactory<TResult> {
  (): TResult[];
  /**
   * Given a length, or length constructor return a function
   * that returns a list of items.
   */
  of(length: number | (() => number)): () => TResult[];
}

export type Factory<TResult, TTraits extends string> = {
  [TTrait in TTraits]: Factory<TResult, TTraits>;
} & {
  /**
   * Turn this Factory into a refinement
   */
  using: UsingFactory<TResult, TTraits>;
  /**
   * Modify the result of the factory by using a deep merge algorithm on the given partial object
   */
  merge(partial: DeepPartial<TResult>): Factory<TResult, TTraits>;
  /**
   * Return a list of items
   */
  list: ListFactory<TResult>;
} & (() => TResult);

interface Random {
  /**
   * A number between the min and max (inclusive)
   */
  between(min: number, max: number): () => number;
  /**
   * A number lessThan or equal to the max.
   */
  lessThan(max: number): () => number;
  /**
   * A number greaterThan or equal to the min
   */
  greaterThan(min: number): () => number;
  (): number;
}

interface FactoryConstructor {
  /**
   * Create a new factory
   */
  <TResult>(constructor: () => TResult): Factory<TResult, never>;
  /**
   * Given a parent factory create a factory that builds off the parent.
   */
  extends<TParent, TResult extends TParent, TTraits extends string>(
    parent: Factory<TParent, TTraits>,
    constructor: (parent: TParent) => TResult
  ): Factory<TResult, TTraits>;
  /**
   * A sequential number emitter good for ids.
   */
  seq(): number;
  /**
   * A series of random number generators.
   */
  random: Random;
}

const createUsingFactory = <TResult, TTraits extends string>(
  constructor: () => TResult,
  transformer: (result: TResult) => TResult,
  traits: [TTraits, (result: TResult) => TResult][]
): UsingFactory<TResult, TTraits> => {
  const traitsObject = Object.fromEntries(
    traits.map(([trait, transform]) => [
      trait,
      {
        get: () =>
          createUsingFactory(
            constructor,
            (result: TResult) => transform(transformer(result)),
            traits
          ),
        enumerable: true
      }
    ])
  );

  const transformList = (length: number, result: TResult[]): TResult[] => {
    const list: TResult[] = [];
    for (let i = 0; i < length; i++) {
      if (i in result) {
        list[i] = transformer(result[i]);
      } else {
        list[i] = transformer(constructor());
      }
    }
    return list;
  };

  const usingListFactory = Object.defineProperties(
    (results: TResult[]) => transformList(results.length, results),
    {
      of: {
        value: (length: number | (() => number)) => (results: TResult[]) =>
          transformList(typeof length === 'number' ? length : length(), results),
        enumerable: true,
        writable: false
      }
    }
  );

  return Object.defineProperties(
    Object.defineProperties((result: TResult) => transformer(result), traitsObject),
    {
      as: {
        value: <TTrait extends string>(name: TTrait) =>
          createFactory<TResult, TTraits | TTrait>(constructor, [...traits, [name, transformer]]),
        writable: false,
        enumerable: true
      },
      merge: {
        value: (partial: DeepPartial<TResult>) =>
          createUsingFactory(
            constructor,
            (result: TResult) => merge(transformer(result), partial),
            traits
          ),
        writable: false,
        enumerable: true
      },
      list: {
        value: usingListFactory,
        writable: false,
        enumerable: true
      }
    }
  ) as UsingFactory<TResult, TTraits>;
};

const createFactory = <TResult, TTraits extends string>(
  constructor: () => TResult,
  traits: [TTraits, (result: TResult) => TResult][]
): Factory<TResult, TTraits> => {
  const traitsObject = Object.fromEntries(
    traits.map(([trait, transformer]) => [
      trait,
      {
        get: () => createFactory(() => transformer(constructor()), traits),
        enumerable: true
      }
    ])
  );

  const makeList = (length: number): TResult[] => {
    const list: TResult[] = [];
    for (let i = 0; i < length; i++) {
      list.push(constructor());
    }
    return list;
  };

  const listFactory = Object.defineProperties(() => makeList(factory.random.between(1, 10)()), {
    of: {
      value: (length: number | (() => number)) => () =>
        makeList(typeof length === 'number' ? length : length()),
      enumerable: true,
      writable: false
    }
  }) as ListFactory<TResult>;

  return Object.defineProperties(
    Object.defineProperties(() => constructor(), traitsObject),
    {
      using: {
        get: () => createUsingFactory(constructor, (result: TResult) => result, traits),
        enumerable: true
      },
      merge: {
        value: (partial: DeepPartial<TResult>) =>
          createFactory(() => merge(constructor(), partial), traits),
        writable: false,
        enumerable: true
      },
      list: {
        value: listFactory,
        enumerable: true,
        writable: false
      }
    }
  ) as Factory<TResult, TTraits>;
};

const getTransforms = <TResult, TTraits extends string>(
  factory: UsingFactory<TResult, TTraits>
): [TTraits, (result: TResult) => TResult][] => {
  return Object.entries(factory).filter(
    (entry): entry is [TTraits, (result: TResult) => TResult] => {
      const [key] = entry;
      return !(key in Function.prototype || key === 'as' || key === 'merge' || key == 'list');
    }
  );
};

let seq = 0;

export const factory: FactoryConstructor = Object.defineProperties(
  <TResult>(constructor: () => TResult) => createFactory(constructor, []),
  {
    extends: {
      value: <TParent, TResult extends TParent, TTraits extends string>(
        parent: Factory<TParent, TTraits>,
        constructor: (parent: TParent) => TResult
      ) => createFactory(() => constructor(parent()), getTransforms(parent.using)),
      enumerable: true,
      writable: false
    },
    seq: {
      value: (): number => seq++,
      enumerable: true,
      writable: false
    },
    random: {
      value: Object.defineProperties(() => Math.random() * Number.MAX_SAFE_INTEGER, {
        between: {
          value: (min: number, max: number) => {
            const range = max - min;
            return () => min + Math.random() * range;
          },
          writable: false,
          enumerable: true
        },
        lessThan: {
          value: (max: number) => () => Math.random() * max,
          writable: false,
          enumerable: true
        },
        greaterThan: {
          value: (min: number) => {
            const range = Number.MAX_SAFE_INTEGER - min;
            return () => min + Math.random() * range;
          }
        }
      }),
      writable: false,
      enumerable: true
    }
  }
) as FactoryConstructor;
