export interface Frame<T> {
  get(): T;
  release(): Promise<void>;
}
