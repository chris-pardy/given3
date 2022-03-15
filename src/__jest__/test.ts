export type TestResult =
  | {
      name: string;
      success: true;
    }
  | {
      name: string;
      success: false;
      message: string;
    };

export class Test {
  readonly #name: string;
  readonly #testCode: () => Promise<void>;

  constructor(name: string, testCode: () => Promise<void>) {
    this.#name = name;
    this.#testCode = testCode;
  }

  filter(partialName: string): Test | null {
    if (this.#name.includes(partialName)) {
      return this;
    }
    return null;
  }

  async run(before: () => Promise<void>, after: () => Promise<void>): Promise<void> {
    await before();
    try {
      await this.#testCode();
    } catch (err) {
      // no-op
    }
    await after();
  }
}
