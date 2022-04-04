import { given, using } from 'given3';
import { suite } from '../__runner__';
import type { TestRunner } from '../__runner__';

describe.each(['Jest', 'Mocha'] as const)(
  'the given 2 compatibility layer with %s runner',
  (mode) => {
    const constructor = given(() => jest.fn().mockReturnValue(0));
    const subsequentConstructor = given(() => jest.fn().mockReturnValue(1));

    const tests = given<TestRunner>(() =>
      suite(mode, ({ given2 }) => {
        describe('given a value', () => {
          given2('value', constructor.value);
          const itBehavesLikeAGiven = () => {
            it('is not accessed', () => {
              return;
            });
            it('is accessed once', () => {
              given2.value;
            });
            it('is accessed twice', () => {
              given2.value;
              given2.value;
            });
          };
          describe('given a value with no prefix', () => {
            given2('value', constructor.value);
            itBehavesLikeAGiven();
          });
          describe('given a value with the "!" prefix', () => {
            given2('!value', constructor.value);
            itBehavesLikeAGiven();
          });
          describe('given a value with the "@" prefix', () => {
            given2('@value', constructor.value);
            itBehavesLikeAGiven();
          });
          describe('given the value is overridden', () => {
            given2('value', subsequentConstructor.value);
            it('is accessed', () => {
              given2.value;
            });
          });
        });
      })
    );

    const testRun = given(() => tests.value.run());

    using(testRun);

    describe.each([
      ['no', 0, 1, 1],
      ['"!"', 1, 1, 1],
      ['"@"', 0, 1, 2]
    ])('given %s prefix', (prefix, callsNotAccessed, callsAccessedOnce, callsAccessedTwice) => {
      tests.define(() => tests.value.filter(`${prefix} prefix`));
      describe('given the value is not accessed', () => {
        tests.define(() => tests.value.filter('not accessed'));
        it(`the constructor is invoked ${callsNotAccessed} times`, () => {
          expect(constructor.value).toHaveBeenCalledTimes(callsNotAccessed);
        });
      });
      describe('given the value is accessed once', () => {
        tests.define(() => tests.value.filter('accessed once'));
        it(`the constructor is invoked ${callsAccessedOnce} times`, () => {
          expect(constructor.value).toHaveBeenCalledTimes(callsAccessedOnce);
        });
      });
      describe('given the value is accessed twice', () => {
        tests.define(() => tests.value.filter('accessed twice'));
        it(`the constructor is invoked ${callsAccessedTwice} times`, () => {
          expect(constructor.value).toHaveBeenCalledTimes(callsAccessedTwice);
        });
      });
    });

    describe('given the value is overridden', () => {
      tests.define(() => tests.value.filter('value is overridden'));
      it('the original constructor is not called', () => {
        expect(constructor.value).not.toHaveBeenCalled();
      });
      it('the subsequent constructor is called', () => {
        expect(subsequentConstructor.value).toHaveBeenCalled();
      });
    });
  }
);
