import { given } from 'given3';
import { suite } from '../__runner__';

describe('refinement', () => {
  const constructor = given(() => jest.fn().mockReturnValue(0));
  const plusOne = given(() => jest.fn((v: number) => v + 1));
  const tests = given(() =>
    suite('Jest', ({ given }) => {
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

  beforeEach(async () => {
    await tests.value.run();
  });

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
});
