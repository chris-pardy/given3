import { factory } from 'given3';
import { faker } from '@faker-js/faker';

export const personFactory = factory(() => ({
  name: faker.name.findName(),
  age: factory.random.between(18, 98)()
}))
  .using.merge({ name: 'Hero Protagonist' })
  .as('hero')
  .using.merge({ name: 'Villain Antagonist' })
  .as('villain')
  .using.merge((person) => ({ ...person, name: `Old ${person.name}`, age: 70 }))
  .as('old');

export const bookFactory = factory(() => ({
  title: `The ${faker.word.adverb()} ${faker.word.verb()} of a ${
    faker.word.adjective
  } ${faker.word.noun()}`,
  isbn: faker.random.numeric(13).toString()
}))
  .using.merge({ title: (title) => `${title} in space!` })
  .as('sciFi');

export const userFactory = factory
  .extends(personFactory, (person) => ({
    ...person,
    id: factory.seq().toString(),
    favoriteBooks: bookFactory.list.of(factory.random.between(0, 5))()
  }))
  .using.villain.merge({ id: 'villainId' })
  .as('villain')
  .using.merge({ favoriteBooks: bookFactory.using.sciFi.list })
  .as('sciFiLover');
