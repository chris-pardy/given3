export interface Frame<T> {
  get(register: (value: T) => void): T;
  release(): Promise<void>;
  onRegister(value: T): void;
}
