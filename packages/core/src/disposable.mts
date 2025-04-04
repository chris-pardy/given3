import type { CleanupFunction } from "./given.mjs";

export function isDisposable(
  value: unknown,
): value is Disposable | AsyncDisposable {
  if (
    value != null &&
    (typeof value === "function" || typeof value === "object")
  ) {
    if (Symbol.dispose in value) {
      return true;
    }
    if (Symbol.asyncDispose in value) {
      return true;
    }
  }
  return false;
}

export function toCleanUp(
  disposable: AsyncDisposable | Disposable | CleanupFunction,
): CleanupFunction {
  if (Symbol.dispose in disposable) {
    return () => (disposable as Disposable)[Symbol.dispose]();
  }
  if (Symbol.asyncDispose in disposable) {
    return async () => (disposable as AsyncDisposable)[Symbol.asyncDispose]();
  }
  return disposable;
}
