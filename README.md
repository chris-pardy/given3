# Given3

Given3 makes the process of testing better by allowing you to define lazily computed values that are scoped to individual tests or suites.

Given3 is designed to work with Jest, using it with other test frameworks is not supported.

## installation

Install via NPM `npm install given3` or Yarn `yarn add given3`

## Usage

Use the given function `import { given } from 'given3';`

Calling the function you may either call it without arguments to create an non-defined given or call it with a definition function to set an initial value.

```ts
const givenWithoutValue = given<number>(); // no value currently, will throw an error if referenced.
const givenWithValue = given(() => 0); // has the value of 0
```

The given object has a property `value` that lazily computes and returns the value of the given.

```ts
const givenWithValue = given(() => 0);
it('has value of 0', () => {
  expect(givenWithValue.value).toBe(0);
});
```

The given value is cached so repeated accesses within a test will not recompute the value;

```ts
const givenWithRandomValue = given(() => Math.random());
it('is cached', () => {
  expect(givenWithRandomValue.value).toBe(givenWithRandomValue.value);
});
```

You an update the value of a given using the `define` method to define a new value for it

```ts
const givenWithValue = given(() => 0);
describe('given the value is 1', () => {
  // within the scope of the current define block the given will be 1
  givenWithValue.define(() => 1);
  it('the value is one', () => {
    expect(givenWithValue.value).toBe(1);
  });
});
it('the value is zero', () => {
  expect(givenWithValue.value).toBe(0);
});
```

## Examples

### An inputs and outputs

Using given3 you can define stubs for values and define, or re-define the values later. This allows you to for-instance create givens for the inputs to your system, and vary the inputs in tests.

```ts
import { given } from 'given3';

describe('Math.min', () => {
  // input stubs have no value initially
  const input1 = given<number>();
  const input2 = given<number>();

  // lazily evaluated result won't be evaluated until the value is referenced
  const result = given(() => Math.min(input1.value, input2.value));

  describe('given input1 is 0', () => {
    input1.define(() => 0);
    describe('given input 2 is 0', () => {
      input2.define(() => 0);
      it('has a result of zero', () => {
        expect(result.value).toBe(0);
      });
    });
    describe('given input 2 is 1', () => {
      input2.define(() => 1);
      it('has a result of zero', () => {
        expect(result.value).toBe(0);
      });
    });

    describe('given input 2 is smaller than input 1', () => {
      // you can define one given with respect to another
      input2.define(() => input1.value - 1);
      it('has a result equal to input2', () => {
        expect(result.value).toBe(input2.value);
      });
    });
  });
});
```

### value refining

It is often useful to be able to reference the previously defined value to refine it. Within the definition of a value simply referencing the given will return the previously defined value.

```ts
import { given } from 'given3';

describe('Math.min', () => {
  const input = given<number[]>(() => []);
  const result = given(() => Math.min(...input.value));
  describe('given the input includes 1', () => {
    // define input as the previous value
    input.define(() => [...input.value, 1]);
    it('the result is 1', () => {
      expect(result.value).toBe(1);
    });
    describe('given the input includes 0', () => {
      // further add to the input
      input.define(() => [...input.define, 0]);
      it('the result is 0', () => {
        expect(result.value).toBe(0);
      });
    });
  });
});
```

### cleanup

While we try to avoid side effects in our tests practically there are times when things may need to be cleaned up after our tests are run.

Use the cleanUp method to define any cleanups that need to be done.

```ts
import { given } from 'given3';
import { Database } from '../database';
import { service } from '../service';

describe('API', () => {
  // define a cleanup function
  const db = given(() => new Database()).cleanUp((db) => db.shutDown());
  const api = given(() => service({ db: db.value }));
  it('stores a user', () => {
    expect(api.value.put({ user: true })).toEqual({ success: true });
  });
});
```

## Advanced Features
### Scope
Options: `'Each' | 'All'`
Default: `'Each'` for `define`, `'All'` for `cleanUp`

Specifies when the cache will be released, or when the cleanup function will run. Use the `'All'` scope to define a value that caches for the whole suite, useful for givens that initialize external resources.

### Immediate
Option: `boolean`
Default: `false`

If true the value will be computed and cached before the test is run.

### Cache
Options: `boolean`
Default: `true`

If false no value will be cached on reads.

