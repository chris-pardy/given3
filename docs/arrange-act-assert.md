# Arrange, Act, Assert

Let's imagine a simple system under test

```ts
export const createPostGetter =
  (baseUrl: string, fetchClient = fetch) =>
  async (postId: string): Post => {
    const response = await fetchClient(`${baseUrl}/posts/${postId}`);
    if (reponse.ok) {
      return await response.json();
    }
    throw new Error(`${response.status}: Error getting Post`);
  };
```

A traditional test following the "Arrange, Act, Assert" pattern would look like this

```ts
describe('the post getter', () => {
  it('gets a post on success', async () => {
    // arrange
    const post = { test: true };
    const fetchClient = jest
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve(post) });
    const postGetter = createPostGetter('https://www.example.com/api', fetchClient);

    // act
    const response = await postGetter('test');

    // assert
    expect(response).toEqual(post);
  });
});
```

With Given we're able to easily extract our arrange and act steps from the test.

```ts
describe('the post getter', () => {
  // arrange
  const post = given(() => ({ test: true }));
  const fetchClient = given(() =>
    jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(post.value) })
  );
  const postGetter = given(() =>
    createPostGetter('https://www.example.com/api', fetchClient.value)
  );
  const postId = given(() => 'test');

  // act
  const response = given(() => postGetter.value(postId.value));

  // assert
  it('gets a post on success', async () => {
    await expect(response.value).resolves.toEqual(post.value);
  });
});
```

With the arrange and act steps extracted we can add new asserts

```ts
describe('the post getter', () => {
  // arrange
  const post = given(() => ({ test: true }));
  const fetchClient = given(() =>
    jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(post.value) })
  );
  const postGetter = given(() =>
    createPostGetter('https://www.example.com/api', fetchClient.value)
  );
  const postId = given(() => 'test');

  // act
  const response = given(() => postGetter.value(postId.value));

  // assert
  it('gets a post on success', async () => {
    await expect(response.value).resolves.toEqual(post.value);
  });

  // assert
  it('calls the fetch client with the post id', async () => {
    // must await this to trigger the call to postGetter
    await response.value;
    expect(fetchClient.value).toHaveBeenCalledWith(
      expect.stringContaining(`/posts/${postId.value}`)
    );
  });
});
```

We know we're always going to want to trigger our service so let's make sure that happens

```ts
describe('the post getter', () => {
  // arrange
  const post = given(() => ({ test: true }));
  const fetchClient = given(() =>
    jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(post.value) })
  );
  const postGetter = given(() =>
    createPostGetter('https://www.example.com/api', fetchClient.value)
  );

  describe('given the post getter is invoked', () => {
    // arrange
    const postId = given(() => 'test');

    // act
    const response = given(() => postGetter.value(postId.value));

    beforeEach(async () => {
      try {
        await response.value;
      } catch (_) {
        return; // no-op since we'll assert on errors
      }
    });

    // assert
    it('gets a post on success', async () => {
      await expect(response.value).resolves.toEqual(post.value);
    });

    // assert
    it('calls the fetch client with the post id', () => {
      expect(fetchClient.value).toHaveBeenCalledWith(
        expect.stringContaining(`/posts/${postId.value}`)
      );
    });
  });
});
```

We can refactor our tests to try different configurations now

```ts
describe('the post getter', () => {
  // arrange
  const fetchClient = given<typeof fetch>(); // note that we don't define this till later
  const postGetter = given(() =>
    createPostGetter('https://www.example.com/api', fetchClient.value)
  );

  describe('given the post getter is invoked', () => {
    // arrange
    const postId = given(() => 'test');

    // act
    const response = given(() => postGetter.value(postId.value));
    beforeEach(async () => {
      try {
        await response.value;
      } catch (_) {
        return; // no-op since we'll assert on errors
      }
    });

    describe('given a successful fetch', () => {
      // arrange
      const post = given(() => ({ test: true }));
      fetchClient.define(() =>
        jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(post.value) })
      );

      // assert
      it('gets a post on success', async () => {
        await expect(response.value).resolves.toEqual(post.value);
      });

      // assert
      it('calls the fetch client with the post id', () => {
        expect(fetchClient.value).toHaveBeenCalledWith(
          expect.stringContaining(`/posts/${postId.value}`)
        );
      });
    });

    describe('given a failed fetch', () => {
      // arrange
      fetchClient.define(() => jest.fn().mockResolvedValue({ ok: false, status: 500 }));

      // assert
      it('throws an error', async () => {
        await expect(response.value).rejects.toThrow();
      });
    });
  });
});
```

## Emergent Pattern
We can see a pattern start to emerge in our tests that generally makes them more readable.

### Use Nested Describe Blocks to Specify the setup of test cases.
Each describe block should specify something about the setup of the test eg. `'given a failed fetch'` or `'given the post getter is invoked'` the first statement in the describe block should then configure that shared setup. Configuration could include things like specifying definitions or refinements for givens, or invoking code in beforeEach hooks.

### Use test / it just for assertions
It's already a best practice to limit each test to at-most one assertion however it's easy to stray from this when your test includes lots of repeated setup.
Let's consider our example above, say we want to assert that the fetch client is only called once. We can simply add the assertion:
```ts
it('calls the fetch client once', () => {
  expect(fetchClient.value).toHaveBeenCalledTimes(1);
})
```
Because all of our setup code shared between our tests this assertion will work with no additional code. Additionally because our tests do exactly one assert they read like a listing of acceptance criteria. If we were to remove the acceptance criteria that a fetch client is only called once we'd simply delete this test.

### Extract common assertions
Let's imagine we have our requirement that the fetch client is only called once. We want that to be applied to both the successful and failed cases, we could re-write our tests.

```ts
describe('the post getter', () => {
  // arrange
  const fetchClient = given<typeof fetch>(); // note that we don't define this till later
  const postGetter = given(() =>
    createPostGetter('https://www.example.com/api', fetchClient.value)
  );

  describe('given the post getter is invoked', () => {
    // arrange
    const postId = given(() => 'test');

    // act
    const response = given(() => postGetter.value(postId.value));
    beforeEach(async () => {
      try {
        await response.value;
      } catch (_) {
        return; // no-op since we'll assert on errors
      }
    });

    // shared assertions
    const itShouldCallTheFetchClientOnce = () => {
      it('calls the fetch client with the post id', () => {
        expect(fetchClient.value).toHaveBeenCalledWith(
          expect.stringContaining(`/posts/${postId.value}`)
        );
      });
      it('calls the fetch client once', () => {
        expect(fetchClient.value).toHaveBeenCalledOnce();
      })
    }

    describe('given a successful fetch', () => {
      // arrange
      const post = given(() => ({ test: true }));
      fetchClient.define(() =>
        jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(post.value) })
      );

      // assert
      it('gets a post on success', async () => {
        await expect(response.value).resolves.toEqual(post.value);
      });

      // asserts
      itShouldCallTheFetchClientOnce()
    });

    describe('given a failed fetch', () => {
      // arrange
      fetchClient.define(() => jest.fn().mockResolvedValue({ ok: false, status: 500 }));

      // assert
      it('throws an error', async () => {
        await expect(response.value).rejects.toThrow();
      });

      // asserts
      itShouldCallTheFetchClientOnce();
    });
  });
});
```

We've extracted our shared assertions and re-used them in both our test cases.