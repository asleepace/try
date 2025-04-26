import { Try } from './try'

export type OkTuple<T> = [T, undefined]
export type ErrorTuple = [undefined, Error]

export class Res<T> extends Array {
  declare 0: T | undefined
  declare 1: Error | undefined

  get value(): T | undefined {
    return this[0]
  }

  get error(): Error | undefined {
    return this[1]
  }

  get ok(): boolean {
    return this.error === undefined
  }

  unwrap(): T {
    if (!this.ok) {
      throw new Error(
        `Failed to unwrap result with error: ${this.error!.message}`
      )
    }
    return this.value as T
  }

  unwrapOr<G>(fallback: G): T | G {
    return this.value ?? fallback
  }

  or = Try.catch

  toString(): string {
    if (this.ok) {
      return `Result.Ok(${String(this.value)})`
    } else {
      return `Result.Error(${this.error!.message})`
    }
  }

  /**
   * Custom inspect method for Node.js environments.
   */
  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return this.toString()
  }
}

export type TryResultOk<T> = Res<T> & {
  0: T
  1: undefined
  value: T
  error: undefined
  ok: true
  or: typeof Try.catch
}

export type TryResultError = Res<never> & {
  0: undefined
  1: Error
  value: undefined
  error: Error
  ok: false
  or: typeof Try.catch
}

export type TryResult<T> = TryResultOk<T> | TryResultError

/**
 * Helper method which takes a try/catch result tuple and creates
 * a TryResultClass instance with all the necessary properties.
 */
export function withResult<T>(tuple: ErrorTuple): TryResultError
export function withResult<T>(tuple: OkTuple<T>): TryResultOk<T>
export function withResult<T>(tuple: OkTuple<T> | ErrorTuple): TryResult<T> {
  const result = new Res<T>(2)
  result[0] = tuple[0]
  result[1] = tuple[1]
  return result as TryResult<T>
}

/**
 * Static factory methods for instantiating the result class.
 */
export namespace Res {
  export function ok<T>(value: T): TryResultOk<T> {
    return withResult([value, undefined]) as TryResultOk<T>
  }

  export function error<T>(error: Error): TryResultError {
    return withResult([undefined, error]) as TryResultError
  }
}
