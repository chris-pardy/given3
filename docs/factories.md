# Factories

Factories are a way to package a set of reusable object constructors.

## Create a Factory

use the `factory` function to create a factory

```ts
import { factory } from 'given3';

export const userFactory = factory(() => ({
  id: factory.seq() // sequence returns a sequential numeric id
}));
```

## Using a Factory

factories are constructor functions and can be plugged directly into `given`

```ts
import { userFactory } from './factories';
import { given } from 'given3';

describe('given a user', () => {
  const user = given(userFactory);
});
```

## Modifying the Factory Result

Use the `.merge` method to modify the result of the factory for your specific needs. Merge supports
a deep merge algorithm that allows setting partial values deep in the object structure.

```ts
import { userFactory } from './factories';
import { given } from 'given3';

describe('given a user', () => {
  const user = given(userFactory.merge({ id: 0 }));
});
```

## Generating a List

Use the `.list` property to return a list of items

```ts
import { userFactory } from './factories';
import { given } from 'given3';

describe('given a userList', () => {
  const userList = given(userFactory.list);
  const longUserList = given(userFactory.list.of(100)); // specify the length of the list
});
```

## Refine the Value with Using

the `.using` property on a factory creates a refiner that can refine an existing value.

```ts
import { userFactory } from './factories';
import { given } from 'given3';

describe('given a user', () => {
  const user = given(userFactory);
  const userList = given(userFactory.list);
  describe('given the id is 0', () => {
    user.refine(userFactory.using.merge({ id: 0 }));
    userList.refine(userFactory.using.merge({ id: 0 }).list.of(1)); // refine entries and length
  });
});
```

## Capture a Set of Refinements as a Trait

You can capture refinements as a trait on a specific factory

```ts
// factories.ts
import { factory } from 'given3';

export const userFactory = factory(() => ({ id: factory.seq() }))
  .using.merge({ id: 0 })
  .as('admin');
```

```ts
// test.ts
import { userFactory } from './factories';
import { given } from 'given3';

describe('given an admin user', () => {
  const user = given(userFactory.admin); // can also refine with userFactory.using.admin
});
```

## Extending a Factory

Factories can extend other factories, inheriting their constructor and traits.

```ts
import { factory } from 'given3';

export const userFactory = factory(() => ({ id: factory.seq() }))
  .using.merge({ id: 0 })
  .as('admin');

export const expertUserFactory = factory.extends(userFactory, (user) => ({
  ...user,
  expertIn: 'Testing'
}));
```

## Extending Traits

It can be useful to extend a trait when extending a factory, you can do this by first invoking the trait as part of the trait definition.

```ts
export const expertUserFactory = factory
  .extends(userFactory, (user) => ({
    ...user,
    expertIn: 'Testing'
  }))
  .using.admin.merge({ expertIn: 'Admin-ing' })
  .as('admin'); // admin will be redefined and capture the userFactory transform.
```
