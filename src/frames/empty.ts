import { Frame } from './frame';
import { NoDefinitionError } from '../errors';

export class EmptyFrame<T> extends Frame<T> {
  protected compute(): T {
    throw new NoDefinitionError();
  }

  release(): Promise<void> {
    return Promise.resolve();
  }
}
