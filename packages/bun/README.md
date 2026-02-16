# given3/bun

Given3 is a testing framework for TypeScript that allows you to write tests in a more readable and expressive way.
It is a spiritual successor to [Given2](https://github.com/tatyshev/given2) but extends it with more powerful caching and typescript support.

## Installation

```bash
bun add --dev @given3/bun
```

## Usage

```ts
import { given } from "@given3/bun";
import { describe, it, expect } from "bun:test";

describe("my test", () => {
  const user = given(() => ({ name: "John", age: 30 }));

  it("should be able to access the user", () => {
    expect(user.value.name).toBe("John");
  });
});
```

For more examples see our [documentation](https://github.com/chris-pardy/given3)
