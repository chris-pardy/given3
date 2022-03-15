export interface Frame<T> {
  previousFrame: Frame<T>;
  get(): T;
  release(): Promise<void>;
}
