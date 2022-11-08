import { given } from 'given3';
import { suite, TestRunner } from '../__runner__';

describe.each(['Jest', 'Mocha'] as const)('refinement with %s runner', (mode) => {
  const constructor = given(() => jest.fn().mockReturnValue(0));
  const plusOne = given(() => jest.fn((v: number) => v + 1));
  const tests = given<TestRunner>();

  const itBehavesAsRefinement = () =>
    describe.each([0, 1, 2])('given %s refinements', (refinements) => {
      tests.define(() => tests.value.filter(`given ${refinements}`));
      it('the original constructor was called once', () => {
        expect(constructor.value).toHaveBeenCalledTimes(1);
      });
      it(`the refinement was called ${refinements} times`, () => {
        expect(plusOne.value).toBeCalledTimes(refinements);
      });
      for (let i = 0; i < refinements; i++) {
        it(`the refinement ${i + 1} was called with ${i}`, () => {
          expect(plusOne.value).toHaveBeenNthCalledWith(i + 1, i);
        });
      }
    });

  beforeEach(async () => {
    await tests.value.run();
  });

  describe('given refinement using .value access', () => {
    tests.define(() =>
      suite(mode, ({ given }) => {
        describe('given a value', () => {
          const g = given(constructor.value);
          const itIsAccessed = () =>
            it('is accessed', () => {
              g.value;
            });
          describe('given 0 refinements', () => {
            itIsAccessed();
          });
          describe('given 1 refinement', () => {
            g.define(() => plusOne.value(g.value));
            itIsAccessed();
          });
          describe('given 2 refinements', () => {
            g.define(() => plusOne.value(g.value)).define(() => plusOne.value(g.value));
            itIsAccessed();
          });
        });
      })
    );
    itBehavesAsRefinement();
  });

  describe('given async refinement using .value access', () => {
    const interrupt = () => new Promise((res) => setImmediate(res));
    constructor.define(() =>
      jest.fn(async () => {
        await interrupt();
        return 0;
      })
    );
    tests.define(() =>
      suite(mode, ({ given }) => {
        describe('given an async value', () => {
          const g = given(constructor.value);
          const itIsAccessed = () =>
            it('is accessed', async (done) => {
              g.value.then(() => done(), done);
            });
          describe('given 0 refinements', () => {
            itIsAccessed();
          });
          describe('given 1 refinement', () => {
            g.define(async () => {
              await interrupt();
              return plusOne.value(await g.value);
            });
            itIsAccessed();
          });
          describe('given 2 refinements', () => {
            g.define(async () => {
              await interrupt();
              return plusOne.value(await g.value);
            }).define(async () => {
              await interrupt();
              return plusOne.value(await g.value);
            });
            itIsAccessed();
          });
        });
      })
    );
    itBehavesAsRefinement();
  });

  describe('given refinement using .refine', () => {
    tests.define(() =>
      suite(mode, ({ given }) => {
        describe('given a value', () => {
          const g = given(constructor.value);
          const itIsAccessed = () =>
            it('is accessed', () => {
              g.value;
            });
          describe('given 0 refinements', () => {
            itIsAccessed();
          });
          describe('given 1 refinement', () => {
            g.refine((v) => plusOne.value(v));
            itIsAccessed();
          });
          describe('given 2 refinements', () => {
            g.refine((v) => plusOne.value(v)).refine((v) => plusOne.value(v));
            itIsAccessed();
          });
        });
      })
    );
    itBehavesAsRefinement();
  });
});

describe('given mutating refinement with .refine', () => {
  const initialName = given(() => 'test');
  const testValue = given(() => ({ name: initialName.value }));
  describe('given no refinements', () => {
    it('has the initial name', () => {
      expect(testValue.value).toEqual({ name: initialName.value });
    });
  });
  describe('given a mutating refinement', () => {
    const newName = given(() => 'not-test');
    testValue.refine((v) => {
      v.name = newName.value;
    });
    it('has the refined value', () => {
      expect(testValue.value).toEqual({ name: newName.value });
    });
  });
});
