# Given 3

Given3 is a testing framework for TypeScript that allows you to write tests in a more readable and expressive way.
It is a spiritual successor to [Given2](https://github.com/tatyshev/given2) but extends it with more powerful caching and typescript support.

## Installation

Install the version of Given3 that matches your testing framework.

for Jest:

```bash
npm install --save-dev @given3/jest
```

for Mocha:

```bash
npm install --save-dev @given3/mocha
```

for Node:

```bash
npm install --save-dev @given3/node
```

for Vitest:

```bash
npm install --save-dev @given3/vitest
```

for Bun:

```bash
bun add --dev @given3/bun
```

for Deno:

```bash
deno add jsr:@given3/deno
```

## Usage

Given3 allows you to write more readable and expressive tests by reusing setup code in an intelligent way.

```typescript
import { given } from "@given3/vitest";
import { describe, it, expect } from "vitest";
import { userRepository } from "../user-repository.mjs";

describe("a user repository", () => {
  // Arrange

  const id = given(() => Math.random());
  const user = given("a user", () => ({
    id: id.value,
    name: "John Doe",
    email: "john.doe@example.com",
  }));

  const repository = given("a user repository with the user", () =>
    userRepository([user.value]),
  );

  // Act

  const userByIdRequest = given<number>("a user by id input"); // defer the value till later

  const userByIdResponse = given(() => repository.value.getUserById(id.value));

  describe("when a known userId is requested", () => {
    // Define the value of the userByIdRequest
    userByIdRequest.define(id.value);

    // Assert
    it("should return the user", () => {
      expect(userByIdResponse.value).toEqual(user.value);
    });
  });

  describe("when an unknown userId is requested", () => {
    // Define the value of the userByIdRequest
    userByIdRequest.define(() => Math.random());

    // Assert
    it("should return null", () => {
      expect(userByIdResponse.value).toBeNull();
    });
  });
});
```

## Caching

Given3 uses a caching mechanism to store the results of the given functions. This means that the functions are only executed once and the results are cached.

```typescript
const id = given(() => Math.random());

const user = given("a user", () => ({
  id: id.value,
  name: "John Doe",
  email: "john.doe@example.com",
}));

it("should have the same user with multiple accesses", () => {
  expect(user.value).toBe(user.value);
});

it("when the id changes the user should be different", () => {
  const user1 = user.value;
  id.define(() => 4938);
  expect(user.value).not.toBe(user1);
});
```

Given3 supports 3 cache modes:

- `Each` - the cache is evicted after each test
- `All` - the cache is evicted after all the tests in the suite / describe block
- `false` - the value is not cached

All cache mode is useful for tests that use external resources, such as end-to-end or integration tests.

```typescript
import { given } from "@given3/vitest";
import { describe, it, expect } from "vitest";
import { userRepository } from "../user-repository.mjs";

describe("a user repository", () => {
  const user = given(
    "a user",
    () => ({
      id: Math.random(),
      name: "John Doe",
      email: "john.doe@example.com",
    }),
    { cache: "All" },
  );

  // Setup the repository, register a cleanup function and reuse it for all the tests
  const repository = given(
    "a user repository",
    async (cleanup) => {
      const repo = await userRepository.connect();
      cleanup(() => repo.disconnect());
      return repo;
    },
    { cache: "All" },
  );

  // Add the user to the repository, register a cleanup function and reuse it for all the tests
  // If the user changes a new user will be added to the repository
  const userAddedToRepository = given(
    "a user added to the repository",
    async (cleanup) => {
      const u = user.value;
      const repo = await repository.value;
      await repo.addUser(u);
      cleanup(() => repo.deleteUser(u.id));
    },
    { cache: "All" },
  );

  describe("when the user is requested by id", () => {
    const userByIdResponse = given(
      async () => {
        await userAddedToRepository.value;
        const repo = await repository.value;
        return repo.getUserById(user.value.id);
      },
      { cache: "All" },
    );

    it("should return the user", async () => {
      expect(await userByIdResponse.value).toEqual(user.value);
    });
  });

  describe("when the user is requested by email", () => {
    const userByEmailResponse = given(
      async () => {
        await userAddedToRepository.value;
        const repo = await repository.value;
        return repo.getUserByEmail(user.value.email);
      },
      { cache: "All" },
    );

    it("should return the user", async () => {
      expect(await userByEmailResponse.value).toEqual(user.value);
    });
  });
});
```
