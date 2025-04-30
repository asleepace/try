/**
 * Primitive result tuple which contains a value.
 */
export type OkTuple<T> = [T, undefined]

/**
 * Primitive result tuple which contains an error.
 */
export type ErrorTuple<E extends Error = Error> = [undefined, E]

/**
 * Result tuple which contains a value.
 */
export type TryResultOk<T, E extends Error = Error> = Res<T, never> & {
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
export type TryResultError<T, E extends Error = Error> = Res<never, E> & {
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
export type TryResult<T, E extends Error = Error> =
  | TryResultOk<T, never>
  | TryResultError<never, E>

/**
 * ## Res
 *
 * This class extends the basic `OkTuple<T>` and `ErrorTuple` types with
 * several convenience methods for accessing data and checking types.
 *
 */
export class Res<T, E extends Error = Error> extends Array {
  /**
   * Helper to convert a caught exception to an Error instance.
   */
  static toError = <Err extends Error = Error>(exception: unknown) => {
    return exception instanceof Error
      ? exception
      : (new Error(String(exception)) as Err)
  }

  static isError = <Err extends Error = Error>(
    exception: unknown
  ): exception is Err => {
    return exception instanceof Error
  }

  /**
   * Helper methods for instantiating via a tuple.
   */
  static from<Val, Err extends Error = Error>(
    tuple: ErrorTuple
  ): TryResultError<never, Err>
  static from<Val, Err extends Error = Error>(
    tuple: OkTuple<Val>
  ): TryResultOk<Val, never>
  static from<Val, Err extends Error = Error>(
    tuple: OkTuple<Val> | ErrorTuple
  ): TryResult<Val, Err> {
    return new Res(tuple) as TryResult<Val, Err>
  }

  /**
   * Instantiate a new result tuple with a value.
   */
  static ok<Val>(value: Val): TryResultOk<Val, never> {
    return Res.from([value, undefined])
  }

  /**
   * Instantiate a new result tuple with an error.
   */
  static err<Err extends Error = Error>(
    exception: unknown
  ): TryResultError<never, Err> {
    return Res.from([undefined, Res.toError(exception)])
  }

  declare 0: T | undefined
  declare 1: E | undefined

  constructor([value, error]: OkTuple<T> | ErrorTuple<E>) {
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
  get error(): E | undefined {
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
  public isOk(): this is TryResultOk<T, never> {
    return this.error === undefined
  }

  /**
   * Returns true if this is the `TryResultError` variant.
   */
  public isErr(): this is TryResultError<never, E> {
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
    console.warn(`Failed to unwrap result with error: ${this.error}`)
    throw this.error
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
      return `Result.Error(${this.error})`
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
   * Allows overriding some of the default properties such as how to handle exceptions
   * and how tht result class should look.
   */
  static onException<E extends Error>(handler: (exception: unknown) => E) {
    Res.toError = handler
  }

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
  static catch<T, Err extends Error = Error>(
    fn: () => never
  ): TryResultError<never, Err>
  static catch<T, Err extends Error = Error>(
    fn: () => Promise<T>
  ): Promise<TryResult<T, Err>>
  static catch<T, Err extends Error = Error>(fn: () => T): TryResult<T, Err>
  static catch<T, Err extends Error = Error>(
    fn: () => T | never | Promise<T>
  ): TryResult<T, Err> | Promise<TryResult<T, Err>> {
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

  /**
   * Utility for initializing a class instance with the given parameters
   * and catching any exceptions thrown. Will return a result tuple of
   * either the class instance or error thrown.
   *
   * ```ts
   * // example instantiating a new URL instance
   * const result = Try.init(URL, "https://www.typescriptlang.org/")
   *
   * if (result.isOK()) return result.hostname
   * ```
   * @note this is a beta feature and subject to change.
   *
   */
  static init<T, A extends any[] = any[], Err extends Error = Error>(
    ctor: new (...args: A) => T,
    ...args: A
  ) {
    return Try.catch<T, Err>(() => {
      return new ctor(...args)
    })
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
