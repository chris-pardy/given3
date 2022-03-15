export class NoDefinitionError extends Error {
  constructor() {
    super('No definition for given value');
  }
}
