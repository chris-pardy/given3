import { given } from 'given3';
import { personFactory } from './factories';

describe('list factories', () => {
  const personList = given(personFactory.list);

  const itIsAPersonList = (min: number, max: number, each: unknown) => {
    it(`has at least ${min} items`, () => {
      expect(personList.value.length).toBeGreaterThanOrEqual(min);
    });
    it(`has at most ${max} items`, () => {
      expect(personList.value.length).toBeLessThanOrEqual(max);
    });
    it('every item matches', () => {
      expect.assertions(personList.value.length);
      personList.value.forEach((person) => {
        expect(person).toEqual(each);
      });
    });
  };

  itIsAPersonList(0, 10, { name: expect.any(String), age: expect.any(Number) });

  describe('given a trait refinement', () => {
    personList.refine(personFactory.using.old.list);
    itIsAPersonList(0, 10, { name: expect.stringMatching(/^Old .*/), age: 70 });
  });

  describe('given a length refinement', () => {
    personList.refine(personFactory.using.list.of(22));
    itIsAPersonList(22, 22, { name: expect.any(String), age: expect.any(Number) });
  });

  describe('given chained refinements', () => {
    personList.refine(personFactory.using.old.merge({ age: 55 }).list.of(20));
    itIsAPersonList(20, 20, { name: expect.stringMatching(/^Old .*/), age: 55 });
  });
});
