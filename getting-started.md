# Getting Started

## Installation

Install the package for your testing framework.

```bash
npm install --save-dev @given3/vitest
```

## Cleaning up setup and teardown

Test often move common setup and teardown into before/after hooks. Given3 allows these to be expressed in a clearly manner by wrapping them in a Given.

Without Given3:

```ts
import { describe, beforeEach, afterEach, it } from "vitest";
import { UserService } from "./user-service.js";

describe("User Service", () => {
  // variable needs to be declared before beforeEach
  let service: UserService;
  const initialUsers = [{ id: 1, name: "John Doe" }];

  beforeEach(() => {
    service = new UserService();
    service.setup(initialUsers);
  });

  // teardown for the service needs to be separate from the setup
  afterEach(() => {
    service.teardown();
  });

  it("should return a user", async () => {
    await expect(service.getUser(1)).resolves.toEqual(initialUsers[0]);
  });
});
```

With Given3:

```ts
import { given, cleanup } from "@given3/vitest";
import { describe, beforeEach, afterEach } from "vitest";
import { UserService } from "./user-service.js";

describe("User Service", () => {
  const initialUsers = [{ id: 1, name: "John Doe" }];

  // given holds but setup and teardown
  const service = given(() => {
    const s = new UserService();
    s.setup(initialUsers);
    cleanup(() => s.teardown());
    return s;
  });

  it("should create a user", async () => {
    // value of the service is lazily initialized when it's first used
    await expect(service.value.getUser(1)).resolves.toEqual(initialUsers[0]);
  });
});
```

### When Setup and teardown are variable

In some cases the setup and teardown methods need to change, given3 gives you a way
to do this without repeating any logic.

Without Given3:

```ts
import { describe, beforeEach, afterEach, it } from "vitest";
import { UserService } from "./user-service.js";

describe("User Service", () => {
  let service: UserService;
  const initialUsers = [{ id: 1, name: "John Doe" }];

  beforeEach(() => {
    service = new UserService();
    service.setup(initialUsers);
  });

  afterEach(() => {
    service.teardown();
  });

  it("should return a user", async () => {
    await expect(service.getUser(1)).resolves.toEqual(initialUsers[0]);
  });

  describe("when there are no users", () => {
    // teardown and re-initialize the service with the new user set
    beforeEach(() => {
      service.teardown();
      service = new UserService();
      service.setup([]);
    });

    it("should throw an error", async () => {
      await expect(service.getUser(1)).rejects.toThrow();
    });
  });
});
```

With Given3:

```ts
import { given, cleanup } from "@given3/vitest";
import { describe, beforeEach, afterEach } from "vitest";
import { UserService } from "./user-service.js";

describe("User Service", () => {
  const initialUsers = given(() => [{ id: 1, name: "John Doe" }]);

  // givens can depend on each other,
  // because they are lazily initialized the service will not be setup until
  // it's first used.
  const service = given(() => {
    const s = new UserService();
    s.setup(initialUsers.value);
    cleanup(() => s.teardown());
    return s;
  });

  it("should return a user", async () => {
    await expect(service.value.getUser(1)).resolves.toEqual(
      initialUsers.value[0],
    );
  });

  describe("when there are no users", () => {
    // define a new value of the initialUsers
    initialUsers.define(() => []);

    it("should throw an error", async () => {
      await expect(service.value.getUser(1)).rejects.toThrow();
    });
  });
});
```

## Unifying "act" and "assert" steps

Given3's lazy evaluation allows you to capture common "act" and even some of the values you'd want to assert on in the setup of a test. This allows for single assertion tests
to avoid repeated setup.

```ts
import { given, cleanup } from "@given3/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserService, User } from "./user-service.js";

describe("User Service", () => {
  const initialUsers = given(() => []);
  const analyticsService = given(() => vi.fn());

  const userService = given(() => {
    const s = new UserService();
    s.setup(initialUsers.value, analyticsService.value);
    cleanup(() => s.teardown());
    return s;
  });

  const userQueryParam = given(() => 1);
  // common "act" step
  const userQueryResult = given(() =>
    userService.value.getUser(userQueryParam.value),
  );

  describe("given a user exists", () => {
    initialUsers.define(() => [{ id: userQueryParam.value, name: "John Doe" }]);

    describe("when the user is requested", () => {
      // make a query to the user service
      beforeEach(() => userQueryResult.value);

      it("should return the user", async () => {
        // cached result won't requery the service
        await expect(userQueryResult.value).resolves.toEqual(
          initialUsers.value[0],
        );
      });

      it("should call the analytics service", () => {
        expect(analyticsService.value).toHaveBeenCalledWith({
          action: "get",
          userId: userQueryParam.value,
        });
      });
    });
  });
});
```

## Using Given3 to refine values

Given3's design allows you to refer to previous value of the given and "refine" them

```ts
import { given } from "@given3/vitest";
import { describe, it, expect } from 'vitest';
import { Factory } from "fishery";
import { faker } from "@faker-js/faker";
import { User, UserService } from "./user-service.js";

describe('User Service', () => {

    const userFactory = given(() => Factory.define<User>(({ sequence }) => ({
        id: sequence,
        name: faker.person.fullName()
    })));

    // create 3 users, using whatever the user factory is at the time.
    const initialUsers = given(() => userFactory.value.buildList(3));

    const userService = given(() => {
        const s = new UserService();
        s.setup(initialUsers.value);
        cleanup(() => s.teardown());
        return s;
    });

    describe('given users have the admin role', () => {
        // refine the user factory to produce users with the admin role
        userFactory.define(() => userFactory.value.params({ roles: ['admin']}));

        it('should mark returned user as admins', async () => {
            const user = await userService.value.getUser(initialUsers.value[0].id);
            expect(user.admin).toBeTruthy();
        })

    }

})
```

## Advanced Stuff

### Caching

Given3 has 3 cache modes, specified in the `cache` option passed as the second argument to `define`:

- `'Each'` - the cache of previous values is cleared after each test
- `'All'` - the cache of previous value is cleared after all the tests in a suite
- `false` - values are not cached

When a cache is used Given3 tracks the other given's that are accessed and will invalidate the cache if any of them have their values updated.

### Cleanup

A Cleanup function is passed to the definition as the first argument, or can also be imported from
the given3 library. When a value is released from the cache any cleanup actions that where registered
during it's initialization are called.

In addition to cleanup actions you can pass a `Disposable` or `AsyncDisposable` to the cleanup function in order to register it as a resource that needs to be disposed. Finally if your definition returns a `Disposable` or `AsyncDisposable` it will be disposed of automatically.

### Middleware

Given3 exports a createGivenConstructor function that takes a list of middleware. These intercept the creation of a given and allow changes to the object being returned.

### Implementing Given3 for other testing frameworks

`@given3/core` exports a `createGivenLibrary` function that can be used to implement Given3 for other testing frameworks.
