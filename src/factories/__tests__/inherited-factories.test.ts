import { given } from 'given3';
import { userFactory } from './factories';

describe('inherited factories', () => {
  const user = given(userFactory);

  it('has the person structure', () => {
    expect(user.value).toEqual(
      expect.objectContaining({
        name: expect.any(String),
        age: expect.any(Number)
      })
    );
  });

  const itHasTheUserStructure = () =>
    it('has the user structure', () => {
      expect(user.value).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          favoriteBooks: expect.any(Array)
        })
      );
    });

  itHasTheUserStructure();

  describe('given a trait inherited from the parent', () => {
    user.refine(userFactory.using.old);
    it('applies the trait', () => {
      expect(user.value).toEqual(
        expect.objectContaining({
          name: expect.stringMatching(/^Old .*/),
          age: 70
        })
      );
    });
    itHasTheUserStructure();
  });

  describe('given a trait that is inherited and extended', () => {
    user.refine(userFactory.using.villain);
    it('applies the trait', () => {
      expect(user.value).toEqual(
        expect.objectContaining({
          name: 'Villain Antagonist',
          age: expect.any(Number)
        })
      );
    });

    it('applies the user override', () => {
      expect(user.value).toEqual(
        expect.objectContaining({
          id: 'villainId',
          favoriteBooks: expect.any(Array)
        })
      );
    });
  });
});
