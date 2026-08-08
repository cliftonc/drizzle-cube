export class DbtGenerateError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DbtGenerateError'
  }
}

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new DbtGenerateError(message)
  }
}
