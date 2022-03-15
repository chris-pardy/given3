import { Frame } from './frame';
import { NoDefinitionError } from '../errors';

class EmptyFrame implements Frame<any> {
  get previousFrame(): Frame<any> {
    return this;
  }

  set previousFrame(_frame: Frame<any>) {
    // no-op
    return;
  }

  get(): any {
    throw new NoDefinitionError();
  }

  release(): Promise<void> {
    return Promise.resolve();
  }
}

export const emptyFrame = new EmptyFrame();
