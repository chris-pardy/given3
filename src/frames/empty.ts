import { Frame } from './frame';
import { NoDefinitionError } from '../errors';

class EmptyFrame implements Frame<any> {
  get(): any {
    throw new NoDefinitionError();
  }

  release(): Promise<void> {
    return Promise.resolve();
  }
}

export const emptyFrame = new EmptyFrame();
