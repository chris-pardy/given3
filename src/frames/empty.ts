import type { Frame } from './frame';
import { NoDefinitionError } from '../errors';

class EmptyFrame implements Frame<any> {
  get(_register: (value: any) => void): any {
    throw new NoDefinitionError();
  }

  release(): Promise<void> {
    return Promise.resolve();
  }

  onRegister(_value: any): void {
    return;
  }
}

export const emptyFrame = new EmptyFrame();
