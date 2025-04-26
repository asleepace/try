import { Try } from './try'
import {
  Res,
  type TryResult,
  type TryResultOk,
  type TryResultError,
} from './result'
export { Try, Res, type TryResult, type TryResultOk, type TryResultError }

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
