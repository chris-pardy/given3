import { given } from 'given3';
import { personFactory } from './factories';

describe('given a factory', () => {
  const person = given(personFactory);

  it('returns the value', () => {
    expect(person.value).toEqual({
      name: expect.any(String),
      age: expect.any(Number)
    });
  });

  const itHasTheOldTraitName = () =>
    it('has the name from the old trait', () => {
      expect(person.value).toEqual(
        expect.objectContaining({
          name: expect.stringMatching(/^Old .*/)
        })
      );
    });

  const itHasTheOldTraitAge = () =>
    it('has the age from the old trait', () => {
      expect(person.value).toEqual(
        expect.objectContaining({
          age: 70
        })
      );
    });

  const itHasAnAgeOfTen = () =>
    it('has an age of 10', () => {
      expect(person.value).toEqual(
        expect.objectContaining({
          age: 10
        })
      );
    });

  describe('given a trait', () => {
    describe('using a new definition', () => {
      person.define(personFactory.old);
      itHasTheOldTraitAge();
      itHasTheOldTraitName();
    });

    describe('using refinement', () => {
      person.refine(personFactory.using.old);
      itHasTheOldTraitAge();
      itHasTheOldTraitName();
    });
  });

  describe('given a merged value', () => {
    describe('using a new definition', () => {
      person.define(personFactory.merge({ age: 10 }));
      itHasAnAgeOfTen();
    });

    describe('using refinement', () => {
      person.refine(personFactory.using.merge({ age: 10 }));
      itHasAnAgeOfTen();
    });
  });

  describe('chaining a trait and a merge', () => {
    describe('using a new definition', () => {
      person.define(personFactory.old.merge({ age: 10 }));
      itHasTheOldTraitName();
      itHasAnAgeOfTen();
    });

    describe('using refinement', () => {
      person.refine(personFactory.using.old.merge({ age: 10 }));
      itHasTheOldTraitName();
      itHasAnAgeOfTen();
    });
  });
});
