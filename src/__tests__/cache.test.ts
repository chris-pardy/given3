import { given } from 'given3';
import { suite } from '../__runner__';

describe('caching', () => {
  const constructor = given(() => jest.fn().mockReturnValue(0));
  const tests = given(() =>
    suite('Jest', ({ given }) => {
      describe('given a value', () => {
        const g = given<number>();
        const itIsAccessed3Times = () =>
          it('is accessed 3 times', () => {
            g.value;
            g.value;
            g.value;
          });
        const itIsAccessedIn2Tests = () =>
          describe('it is accessed in 2 tests', () => {
            it('is accessed in one test', () => {
              g.value;
            });
            it('is accessed in another test', () => {
              g.value;
            });
          });
        describe('given the definition is cached at each scope', () => {
          g.define(constructor.value, { cache: true, cacheScope: 'Each' });
          itIsAccessed3Times();
          itIsAccessedIn2Tests();
        });
        describe('given the definition is cached at all scope', () => {
          g.define(constructor.value, { cache: true, cacheScope: 'All' });
          itIsAccessedIn2Tests();
        });
        describe('given the definition is not cached', () => {
          g.define(constructor.value, { cache: false });
          itIsAccessed3Times();
        });
        it('given the definition is cached in a test', () => {
          g.define(constructor.value, { cache: true });
          g.value;
          g.value;
          g.value;
        });
      });
    })
  );

  // run the tests jest like tests before the test
  beforeEach(async () => {
    await tests.value.run();
  });

  describe('given the value is accessed 3 times', () => {
    tests.define(() => tests.value.filter('is accessed 3 times'));
    describe('given the definition is cached', () => {
      tests.define(() => tests.value.filter('is cached'));
      it('the constructor is only called once', () => {
        expect(constructor.value).toBeCalledTimes(1);
      });
    });
    describe('given the definition is not cached', () => {
      tests.define(() => tests.value.filter('is not cached'));
      it('the constructor is called 3 times', () => {
        expect(constructor.value).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('given the value is accessed in 2 tests', () => {
    tests.define(() => tests.value.filter('accessed in 2 tests'));
    describe('given the cacheScope is each', () => {
      tests.define(() => tests.value.filter('each scope'));
      it('the constructor is called twice', () => {
        expect(constructor.value).toHaveBeenCalledTimes(2);
      });
    });
    describe('given the cacheScope is all', () => {
      tests.define(() => tests.value.filter('all scope'));
      it('the constructor is called once', () => {
        expect(constructor.value).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('given the value is cached inside a test and accessed multiple times', () => {
    tests.define(() => tests.value.filter('in a test'));
    it('the constructor is called once', () => {
      expect(constructor.value).toHaveBeenCalledTimes(1);
    });
  });
});
