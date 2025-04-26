export type OkTuple<T> = [T, undefined]
export type ErrorTuple = [undefined, Error]

export type TryResultOk<T> = OkTuple<T> & {
  0: T
  1: undefined
  unwrapOr<G>(fallback: G): T | G
  unwrap(): T
  value: T
  error: undefined
  ok: true
}

export type TryResultError = ErrorTuple & {
  0: undefined
  1: Error
  unwrapOr<G>(fallback: G): G
  unwrap(): never
  value: undefined
  error: Error
  ok: false
}

export type TryResult<T> = TryResultOk<T> | TryResultError

/**
 * Helper method which takes a try/catch result tuple and extends
 * it with several convenience properties.
 */
export function withResult<T>(tuple: ErrorTuple): TryResultError
export function withResult<T>(tuple: OkTuple<T>): TryResultOk<T>
export function withResult<T>(tuple: OkTuple<T> | ErrorTuple): TryResult<T> {
  return Object.defineProperties(tuple, {
    value: {
      get() {
        if (!this || this.length !== 2) return undefined
        return this[0]
      },
    },
    error: {
      get() {
        if (!this || this.length !== 2) return undefined
        return this[1]
      },
    },
    ok: {
      get() {
        return this.error === undefined
      },
    },
    unwrap: {
      value() {
        if (!this.ok)
          throw new Error(
            `Failed to unwrap result with error: ${this.error.message}`
          )
        return this.value
      },
    },
    unwrapOr: {
      value<G>(fallback: G): T | G {
        return this.value ?? fallback
      },
    },
  }) as TryResult<T>
}
