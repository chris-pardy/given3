import { given } from 'given3';

describe('test scoped givens', () => {
  const g = given(() => 0);
  it('define in the test scope overrides parent value', () => {
    g.define(() => 1);
    expect(g.value).toBe(1);
  });
  it("cleanup in the test scope doesn't run as part of the test", () => {
    const destructor = jest.fn();
    g.cleanUp(destructor);
    g.value;
    expect(destructor).not.toHaveBeenCalled();
  });
});
