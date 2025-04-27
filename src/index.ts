/**
 * Primitive result tuple which contains a value.
 */
export type OkTuple<T> = [T, undefined]

/**
 * Primitive result tuple which contains an error.
 */
export type ErrorTuple = [undefined, Error]

/**
 * Result tuple which contains a value.
 */
export type TryResultOk<T> = Res<T> & {
  0: T
  1: undefined
  value: T
  error: undefined
  ok: true
  or: typeof Try.catch
}

/**
 * Result tuple which contains an error.
 */
export type TryResultError = Res<never> & {
  0: undefined
  1: Error
  value: undefined
  error: Error
  ok: false
  or: typeof Try.catch
}

/**
 * Result tuple returned from calling `Try.catch(fn)`
 */
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
   * Helper to convert a caught exception to an Error instance.
   */
  static toError = (exception: unknown): Error => {
    return exception instanceof Error ? exception : new Error(String(exception))
  }

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

  static err<G>(exception: unknown): TryResultError {
    return Res.from([undefined, Res.toError(exception)])
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
   * Getter which returns `true` if the error value is `undefined`.
   */
  get ok(): boolean {
    return this.error === undefined
  }

  /**
   * Returns true if this is the `TryResultOk<T>` variant.
   */
  public isOk(): this is TryResultOk<T> {
    return this.error === undefined
  }

  /**
   * Returns true if this is the `TryResultError` variant.
   */
  public isErr(): this is TryResultError {
    return this.error !== undefined
  }

  /**
   * Will return the value if present otherwise will re-throw the error,
   * recommended for development only.
   *
   * @see `unwrapOr(fallback)` for a safer option.
   */
  public unwrap(): T | never {
    if (this.isOk()) return this.value
    throw new Error(
      `Failed to unwrap result with error: ${this.error?.message}`
    )
  }

  /**
   * Will unwrap the result tuple and return the value if present,
   * otherwise will return the provided fallback.
   */
  public unwrapOr<G>(fallback: G): T | G {
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
  public or = Try.catch

  /**
   * Converts this to a human readable string.
   */
  public toString(): string {
    if (this.ok) {
      return `Result.Ok(${String(this.value)})`
    } else {
      return `Result.Error(${this.error?.message})`
    }
  }

  /**
   * Custom inspect method for Node.js environments.
   */
  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return this.toString()
  }
}

/**
 * ## Try
 *
 * This class provides several utility methods for error handling and catching
 * exceptions and return them as result tuples containing either an error or
 * a value (see `Res` class).
 *
 * ```ts
 * const [json, error] = Try.catch(() => JSON.parse(userData))
 *
 * if (!error) return json.user // type-safe!
 *
 * const result = await Try.catch(fetchUser)  // supports async / await
 *
 * if (result.ok) return result.unwrap()  // powerful result types
 *
 * console.warn(result.error.message) //  exceptions are converted to Errors
 * ```
 *
 * For a more shorthand version see the value-error-tuple (vet) utility,
 * which can be used like so:
 *
 * ```ts
 * import { vet } from '@asleepace/try'
 *
 * return vet(() => response.json()).unwrapOr(defaultValue)
 * ```
 *
 * For more information and detailed usage on the specification:
 *
 * @see https://github.com/asleepace/try
 *
 */
export class Try {
  /**
   * Simple error handling utility which will invoke the provided function and
   * catch any thrown errors, the result of the function execution will then be
   * returned as a result tuple.
   *
   * ```ts
   *  // Simple example for common operations...
   *  const [url, error] = Try.catch(() => new URL(userInput))  // call synchronously
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
 * ## Value-Error Tuple
 *
 * Shorthand utility for calling `Try.catch(fn)` which returns either
 * a value or error tuple.
 *
 * ```ts
 * // initializing a url from user input
 * const [link, error] = vet(() => new URL(userInput))
 *
 * if (!error) return link.href
 * ```
 */
export const vet = Try.catch
