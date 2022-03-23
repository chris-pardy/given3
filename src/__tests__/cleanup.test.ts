import { given } from 'given3';
import { suite } from '../__runner__';

describe.each(['Jest', 'Mocha'] as const)('cleanup with %s runner', (mode) => {
  // simulate shared resource usage for instance in an integration test
  let resource = 0;
  const constructor = given(() => jest.fn(() => resource++));
  const destructor = given(() =>
    jest.fn((r: number) => {
      resource = r;
    })
  );
  const tests = given(() =>
    suite(mode, ({ given }) => {
      describe('given a value', () => {
        const g = given<number>(constructor.value);
        const itAccessesTheValueIn3Tests = () =>
          describe('given the value is accessed in 3 tests', () => {
            it('is accessed in test 1 of 3', () => {
              g.value;
            });
            it('is accessed in test 2 of 3', () => {
              g.value;
            });
            it('is accessed in test 3 of 3', () => {
              g.value;
            });
          });
        describe('given a destructor with all scope', () => {
          g.cleanUp(destructor.value, 'All');
          itAccessesTheValueIn3Tests();
        });
        describe('given a destructor with the each scope', () => {
          g.cleanUp(destructor.value, 'Each');
          itAccessesTheValueIn3Tests();
        });
        it('given a destructor in the test scope', () => {
          g.cleanUp(destructor.value);
          g.value;
        });
      });
    })
  );

  beforeEach(async () => {
    resource = 0;
    await tests.value.run();
  });

  describe('given destructor with all scope', () => {
    tests.define(() => tests.value.filter('all scope'));
    it('the constructor uses 3 resources', () => {
      expect(constructor.value.mock.results).toEqual([
        { type: 'return', value: 0 },
        { type: 'return', value: 1 },
        { type: 'return', value: 2 }
      ]);
    });
    it('the destructor releases 3 resources', () => {
      expect(destructor.value.mock.calls).toEqual([[0], [1], [2]]);
    });
  });

  describe('given destructor with each scope', () => {
    tests.define(() => tests.value.filter('each scope'));
    it('the constructor uses 1 resources', () => {
      expect(constructor.value.mock.results).toEqual([
        { type: 'return', value: 0 },
        { type: 'return', value: 0 },
        { type: 'return', value: 0 }
      ]);
    });
    it('the destructor releases the same resource 3 times', () => {
      expect(destructor.value.mock.calls).toEqual([[0], [0], [0]]);
    });
  });

  describe('given destructor in the test scope', () => {
    tests.define(() => tests.value.filter('test scope'));
    it('the destructor is invokes with the one value', () => {
      expect(destructor.value).toHaveBeenCalledWith(0);
    });
  });

  describe('given the cleanup is defined before the value', () => {
    tests.define(() =>
      suite(mode, ({ given }) => {
        describe('given a value', () => {
          const g = given<number>().cleanUp(destructor.value);
          describe('given the value is defined', () => {
            g.define(constructor.value);
            it('accesses the value', () => {
              g.value;
            });
          });
        });
      })
    );
    it('the destructor is still called with the value', () => {
      expect(destructor.value).toHaveBeenCalledWith(0);
    });
  });
});
