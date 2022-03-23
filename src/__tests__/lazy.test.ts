import { given } from 'given3';
import { suite } from '../__runner__';

describe('lazy', () => {
  const constructor = given(() => jest.fn().mockReturnValue(0));
  const tests = given(() =>
    suite('Jest', ({ given }) => {
      describe('given a value', () => {
        const g = given<number>();
        const itIsNotAccessed = () => it('is not accessed', () => void 0);
        const itIsAccessed = () =>
          it('is accessed', () => {
            g.value;
          });
        describe('given the value is immediate', () => {
          g.define(constructor.value, { immediate: true }), itIsNotAccessed();
          itIsAccessed();
        });
        describe('given the value is not immediate', () => {
          g.define(constructor.value, { immediate: false });
          itIsNotAccessed();
          itIsAccessed();
        });
      });
    })
  );

  beforeEach(async () => {
    await tests.value.run();
  });

  describe('given the value is not accessed', () => {
    tests.define(() => tests.value.filter('is not accessed'));
    describe('given the value is immediate', () => {
      tests.define(() => tests.value.filter('is immediate'));
      it('the constructor has been called', () => {
        expect(constructor.value).toHaveBeenCalled();
      });
    });
    describe('given the value is not immediate', () => {
      tests.define(() => tests.value.filter('is not immediate'));
      it('the constructor has not been called', () => {
        expect(constructor.value).not.toHaveBeenCalled();
      });
    });
  });

  describe('given the value is accessed', () => {
    tests.define(() => tests.value.filter('is accessed'));
    describe.each(['is', 'is not'])('given the value %s immediate', (is) => {
      tests.define(() => tests.value.filter(`${is} immediate`));
      it('the constructor has been called', () => {
        expect(constructor.value).toHaveBeenCalled();
      });
    });
  });
});
