import { given, using } from 'given3';
import { suite, TestRunner } from '../__runner__';

describe.each(['Jest', 'Mocha'] as const)('scoping rules with %s runner', (mode) => {
  const tests = given<TestRunner>();
  const testRun = given(() => tests.value.run());

  using(testRun);

  describe('define scoping', () => {
    const constructorOne = given(() => jest.fn().mockReturnValue(0));
    const constructorTwo = given(() => jest.fn().mockReturnValue(1));
    const constructorThree = given(() => jest.fn().mockReturnValue(2));

    tests.define(() =>
      suite(mode, ({ given }) => {
        describe('given a value', () => {
          const g = given(constructorOne.value);
          describe('given a different value', () => {
            g.define(constructorTwo.value).define(constructorThree.value);
            it('accesses the different value', () => {
              g.value;
            });
          });
          it('accesses the value', () => {
            g.value;
          });
        });
      })
    );

    it('accesses the original value', () => {
      expect(constructorOne.value).toHaveBeenCalledTimes(1);
    });

    it('accesses the different value', () => {
      expect(constructorThree.value).toBeCalledTimes(1);
    });

    it("doesn't access the intermediate definition", () => {
      expect(constructorTwo.value).not.toBeCalled();
    });
  });

  describe('cleanup scoping', () => {
    const constructor = given(() => jest.fn().mockReturnValue(0));
    const destructor = given(() => jest.fn());

    tests.define(() =>
      suite(mode, ({ given }) => {
        describe('given a value', () => {
          const g = given<number>();
          describe('given the each cache scope', () => {
            g.define(constructor.value, { cacheScope: 'Each' }).cleanUp(destructor.value);
            it('is accessed multiple times in a test', () => {
              g.value;
              g.value;
              g.value;
            });
          });
          describe('given the all cache scope', () => {
            g.define(constructor.value, { cacheScope: 'All' }).cleanUp(destructor.value);
            it('test 1', () => {
              g.value;
            });
            it('test 2', () => {
              g.value;
            });
            it('test 3', () => {
              g.value;
            });
          });
        });
      })
    );

    describe.each(['each', 'all'])('given the value cached at %s scope', (scope) => {
      tests.define(() => tests.value.filter(`${scope} cache scope`));
      it('the constructor is run once', () => {
        expect(constructor.value).toHaveBeenCalledTimes(1);
      });
      it('the destructor is run once', () => {
        expect(destructor.value).toHaveBeenCalledTimes(1);
      });
    });
  });
});
