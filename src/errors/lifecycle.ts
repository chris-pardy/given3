export class LifecycleError extends Error {
  constructor(functionName: string) {
    super(`${functionName} must be called at the root of a module or inside a describe block.`);
  }
}
