export class LoopDetectionError extends Error {
  constructor() {
    super('Detected Loop between given calls, terminating');
  }
}
