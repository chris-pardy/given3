import { given, using, NoDefinitionError, LoopDetectionError, LifecycleError } from 'given3';

describe('errors', () => {
  describe('no definition error', () => {
    const noDef = given<number>();
    it('throw no definition error when undefined value is accessed', () => {
      expect(() => noDef.value).toThrowError(NoDefinitionError);
    });
  });
  describe('loop detection error', () => {
    const loop1 = given<number>();
    const loop2 = given<number>(() => loop1.value + 1);
    loop1.define(() => loop2.value + 1);
    it('throws loop detection error if a loop is detected', () => {
      expect(() => loop1.value).toThrow(LoopDetectionError);
    });
  });
  describe('lifecycle error', () => {
    const value = given(() => 1);
    it('throws a lifecycle error if using a given in a test', () => {
      expect(() => using(value)).toThrow(LifecycleError);
    });
  });
});
