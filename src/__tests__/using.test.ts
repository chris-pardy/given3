import { given, using } from 'given3';
import { suite } from '../__runner__';

describe.each(['Jest', 'Mocha'] as const)('using with %s runner', (mode) => {
  const constructor = given(() => jest.fn().mockReturnValue(0));
  const tests = given(() =>
    suite(mode, ({ given, using }) => {
      describe('given a non-promise value', () => {
        const g = given<number>(constructor.value);
        describe('using the value', () => {
          using(g);
          it("doesn't access the value", () => void 0);
        });
      });
      describe('given a promise of a value', () => {
        const g = given<Promise<number>>(() => Promise.resolve().then(constructor.value));
        describe('using the value', () => {
          using(g);
          it("doesn't access the value", () => void 0);
        });
      });
    })
  );

  const testRun = given(() => tests.value.run());

  using(testRun);

  describe.each(['given a non-promise value', 'given a promise of a value'])(
    '%s',
    (description) => {
      tests.define(() => tests.value.filter(description));
      it('when the tests are run the constructor is called', () => {
        expect(constructor.value).toHaveBeenCalled();
      });
      describe("when the tests aren't run", () => {
        tests.define(() => tests.value.filter('not using the value'));
        it('the constructor is not called', () => {
          expect(constructor.value).not.toHaveBeenCalled();
        });
      });
    }
  );
});
