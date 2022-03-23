import { given } from 'given3';
import { suite } from '../__runner__';

describe('redefinition', () => {
  const initialConstructor = given(() => jest.fn().mockReturnValue(0));
  const subsequentConstructor = given(() => jest.fn().mockReturnValue(1));
  const tests = given(() =>
    suite('Jest', ({ given }) => {
      describe('given a value', () => {
        const g = given<number>(initialConstructor.value);
        it('accesses the initial value', () => {
          g.value;
        });
        describe('given a subsequent value is defined', () => {
          g.define(subsequentConstructor.value);
          it('accesses the subsequent value', () => {
            g.value;
          });
        });
        it('given a redefinition inside a test', () => {
          g.define(subsequentConstructor.value);
          g.value;
        });
      });
    })
  );
  beforeEach(async () => {
    await tests.value.run();
  });
  describe('given the value is not redefined', () => {
    tests.define(() => tests.value.filter('initial value'));
    it('the initial constructor is called', () => {
      expect(initialConstructor.value).toHaveBeenCalled();
    });
    it('the subsequent constructor is not called', () => {
      expect(subsequentConstructor.value).not.toHaveBeenCalled();
    });
  });
  describe('given the value is redefined', () => {
    tests.define(() => tests.value.filter('subsequent value'));
    it('the initial constructor is not called', () => {
      expect(initialConstructor.value).not.toHaveBeenCalled();
    });
    it('the subsequent constructor is called', () => {
      expect(subsequentConstructor.value).toHaveBeenCalled();
    });
  });
  describe('given the value is redefined inside a test', () => {
    tests.define(() => tests.value.filter('inside a test'));
    it('the initial constructor is not called', () => {
      expect(initialConstructor.value).not.toHaveBeenCalled();
    });
    it('the subsequent constructor is called', () => {
      expect(subsequentConstructor.value).toHaveBeenCalled();
    });
  });
});
