# Motivation
The Given libraries [given](https://www.npmjs.com/package/given), [given2](https://www.npmjs.com/package/given2), [givens](https://www.npmjs.com/package/givens), and [given3](https://www.npmjs.com/package/given3) all seek to help improve tests by allowing easy re-use of setup code.
To understand how any of the Given libraries can help see: [arrange-act-assert.md](./arrange-act-assert.md).

## Compared to Given2
The primary departure from Given2 was in the service of type-safety
```ts
// with given2
given('testNumber', () => 1);
// redefinition allows you to change the type
given('testNumber', () => 'oops');
// given.whatever is type any, letting you write unsafe code
given.testNumber.filter(() => false)


// with given3
const testNumber = given(() => 1);
// type error because redefinition requires the same same type
testNumber.define(() => 'oops');
// type error because the type of .value is known
testNumber.value.filter(() => false);
```
Beyond type-safety this API change allows for a few additional advantages.
1. Autocompletion in editors.
2. No instances of mis-typed names (eg. given.testNumver)

## Advanced Features
In addition to the redesigned interface there were several features added to Given3 to help it be more useful when running integration or acceptance tests.

### Cache Scope
By default the value of a given is computed once and cached until an `afterEach` hook is run. This effectively means that no values are re-used between tests. While this is useful for test isolation it slows down tests that depend on slower external resources as is often the case with integration or end-to-end acceptance tests. To support these you can specify `cacheScope: 'All'` when defining a given value, this will cause a value to be computed once and cached until an `after / afterAll` hook is run.

### Smart Cache
Sometimes you want your values to be re-used across tests, unless they change. By specifying `cache: 'smart'` when defining a given value the cache will be evicted if any given whose value is referenced in your constructor changes. A common pattern for this is to have 1 given represent the request to a service and another represent the response. With the All cache scope and the smart caching enabled the response will be re-used across tests until the request changes.

### Cleanup
Because Givens are lazily computed and cached it can be hard to know when or if you need to cleanup resources that your test created. In order to make this process easier a `.cleanup` method on the given can be used to attach a cleanup handler, by default the cleanup handlers run in an `after / afterAll` block so if you need resources cleaned up between each test you should specify the `'Each'` scope.

### Refinement
Due to a significant re-architecture in how Given3 hooks into a test suite compared to Given2 we're able to support refinement of values. This occurs when a value references itself in it's definition or via the `.refine` method.

During refinement a computation for a given value is able to access the value that would have been previously computed, however this must be directly accessed.
```ts

const a = given(() => 1);
a.define(() => a.value + 1); // equivalent to a.refine(v => v + 1)

it('is 2', () => {
  expect(a.value).toBe(2);
})

const one = given(() => 1);
const two = given(() => one.value + 1);
one.define(() => two.value - 1);

it('is 1', () => {
  expect(one.value).toBe(1);
  // throws an error due to circular reference.
})
```