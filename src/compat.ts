import { given } from './constructor';
import type { Constructor, Given, GivenOptions } from './given';
import { afterTest, beforeTest } from './test-hooks';

export interface Given2 {
  <T>(name: string, constructor: Constructor<T>, options?: GivenOptions): Given<T>;
  [key: string]: any;
}

const RESERVED = ['name', 'length', 'caller', 'arguments'];

export class Given2Error extends Error {
  constructor() {
    super(
      'Can not override the "name", "length", "caller", and "arguments" properties.\nCould you use a another property name?'
    );
  }
}

const removeProp = (property: string) => {
  Object.defineProperty(given2, property, {
    configurable: true,
    enumerable: false
  });
};

const registry = new Map<string, Given<unknown>>();

/**
 * given2 compatibility
 * @param name the name of the given, used as the property name on the given2 object
 * @param constructor the constructor to create the value when it is accessed.
 * @param options an options object specifying the behavior of the Given.
 * @returns a Given that can be used to leverage new given3 features like cleanup.
 */
const given2: Given2 = <T>(
  name: string,
  constructor: Constructor<T>,
  options: GivenOptions = {}
): Given<T> => {
  // parse the name prefix into the options
  switch (name[0]) {
    case '!':
      name = name.substring(1);
      options.immediate = true;
      break;
    case '@':
      name = name.substring(1);
      options.cache = false;
  }

  if (RESERVED.includes(name)) {
    throw new Given2Error();
  }

  if (!registry.has(name)) {
    registry.set(name, given<T>());
  }

  const givenImpl = registry.get(name)!.define(constructor, options);
  beforeTest(() => {
    Object.defineProperty(given2, name, {
      enumerable: true,
      configurable: true,
      get: () => givenImpl.value
    });
  });

  afterTest(async () => {
    removeProp(name);
  });

  return givenImpl as Given<T>;
};

removeProp('apply');
removeProp('call');
removeProp('bind');
removeProp('constructor');
removeProp('toString');
removeProp('asPromise');
removeProp('toString');
removeProp('hasOwnProperty');
removeProp('isPrototypeOf');
removeProp('propertyIsEnumerable');
removeProp('toLocaleString');
removeProp('valueOf');

export { given2 };
