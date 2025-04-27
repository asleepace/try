/**
 * ## Result Tuple Definitions
 *
 * The following definitions are for the result object returned by the try catch
 * method.
 */
export type OkTuple<T> = [T, undefined]
export type ErrorTuple = [undefined, Error]
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
 * ## Res
 *
 * This class extends the basic `OkTuple<T>` and `ErrorTuple` types with
 * several convenience methods for accessing data and checking types.
 *
 */
export class Res<T> extends Array {
  /**
   * Helper methods for instantiating via a tuple.
   */
  static from<G>(tuple: ErrorTuple): TryResultError
  static from<G>(tuple: OkTuple<G>): TryResultOk<G>
  static from<G>(tuple: OkTuple<G> | ErrorTuple): TryResult<G> {
    return new Res(tuple) as TryResult<G>
  }

  static ok<G>(value: G): TryResultOk<G> {
    return Res.from([value, undefined])
  }

  static err<G>(e: unknown): TryResultError {
    const error = e instanceof Error ? e : new Error(String(e))
    return Res.from([undefined, error])
  }

  declare 0: T | undefined
  declare 1: Error | undefined

  constructor([value, error]: OkTuple<T> | ErrorTuple) {
    super(2)
    this[0] = value
    this[1] = error
  }

  /**
   * Getter which returns the value in the result tuple.
   */
  get value(): T | undefined {
    return this[0]
  }

  /**
   * Getter which returns the error in the result tuple.
   */
  get error(): Error | undefined {
    return this[1]
  }

  /**
   * Will return `true` if the result error is `undefined`.
   */
  get ok(): boolean {
    return this.error === undefined
  }

  public isOk(): this is TryResultOk<T> {
    return this.error === undefined
  }

  public isErr(): this is TryResultError {
    return this.error !== undefined
  }

  /**
   * Will return the value if present otherwise will re-throw the error,
   * recommended for development only.
   *
   * @see `unwrapOr(fallback)` for a safer option.
   */
  unwrap(): T | never {
    if (!this.ok) {
      throw new Error(
        `Failed to unwrap result with error: ${this.error!.message}`
      )
    }
    return this.value as T
  }

  /**
   * Will unwrap the result tuple and return the value if present,
   * otherwise will return the provided fallback.
   */
  unwrapOr<G>(fallback: G): T | G {
    return this.value ?? fallback
  }

  /**
   * Allows chaining multiple try/catch statements together:
   * ```ts
   * const url = Try.catch(() => new URL(`${userInput}`))
   *    .or(() => new URL(`https://${userInput}`))
   *    .or(() => new URL(`https://${userInput}`.trim()))
   *    .unwrapOr(new URL(`https://default.com`))
   * ```
   */
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

export class Try {
  /**
   * # Try / Catch
   *
   * Simple error handling utility which will invoke the provided function and
   * catch any thrown errors, the result of the function execution will then be
   * returned as a result tuple.
   *
   * ```ts
   *  // Simple example for common operations...
   *  const [url, error] = Try.catch(() => new URL(userInput))  // call sync
   *
   *  if (error) return console.warn(error.message)
   *
   *  const [response, networkError] = await Try.catch(() => fetch(url))  // or async
   *  const [jsonData, parsingError] = await Try.catch(() => response!.json())
   *
   *  if (parsingError) return console.warn(error.message)
   *
   *  return jsonData
   * ```
   */
  static catch<T>(fn: () => never): TryResultError
  static catch<T>(fn: () => Promise<T>): Promise<TryResult<T>>
  static catch<T>(fn: () => T): TryResult<T>
  static catch<T>(
    fn: () => T | Promise<T>
  ): TryResult<T> | Promise<TryResult<T>> {
    try {
      const output = fn()
      if (output instanceof Promise) {
        return output
          .then((value) => Res.ok(value))
          .catch((error) => Res.err(error))
      } else {
        return Res.ok(output)
      }
    } catch (e) {
      return Res.err(e)
    }
  }
}

/**
 * ## Value / Error Tuple (VET)
 * Shorthand utility for calling `Try.catch(fn)` which returns either
 * a value or error tuple.
 *
 * ```ts
 * // initializing a url from user input
 * const [link, error] = vet(() => new URL("http://example.com/" + userInput))
 *
 * if (!error) return link.href
 * ```
 */
export const vet = Try.catch
