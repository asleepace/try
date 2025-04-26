import { Res, type TryResult, type TryResultError } from './result'

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
          .catch((error) => Res.error(error))
      } else {
        return Res.ok(output)
      }
    } catch (e) {
      return Res.error(e)
    }
  }
}
