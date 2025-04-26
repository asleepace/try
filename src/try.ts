import { withResult, type TryResult } from "./result"

export class Try {
    static err = (e: unknown) => e instanceof Error ? e : new Error(String(e))

    static #handler<T, Fn extends () => T>(fn: Fn, isAsync?: false): TryResult<T>
    static #handler<T, Fn extends () => Promise<T>>(fn: Fn, isAsync?: true): Promise<TryResult<T>>
    static #handler<T, Fn extends () => T>(fn: Fn, isAsync?: true): Promise<TryResult<T>> | Promise<TryResult<Promise<T>>>
    static #handler<T, Fn extends () => T>(fn: Fn, isAsync?: boolean): TryResult<T> | Promise<TryResult<T>> {
        try {
            const output = fn()
            if (output instanceof Promise) {
                return new Promise(async (resolve) => {
                    try {
                        const value = await output
                        return resolve(withResult([value, undefined]))
                    } catch (e) {
                        return resolve(withResult([undefined, Try.err(e)]))
                    }
                })
            } else {
                return withResult([output, undefined])
            }
        } catch (e) {
            return withResult([undefined, Try.err(e)])
        }
    }

    /**
     * @note the ordering of catch overloads matters and the Promise<Result<T>>
     * overload needs to appear first (possibly reverse of the _handler).
     * This can cause some issues if the only return type is never.
     * 
     * ```ts
     * const [_, err] = Try.catch(() => {
     *    throw new Error('Edge case')
     *    // un-comment the next line and it works?
     *    // return 123; 
     * }) 
     * ```
     */


    /**
     * # Try / Catch
     * 
     * Simple error handling utility which will invoke the provided function and
     * catch any thrown errors, the result of the function execution will then be
     * returned as a result tuple.
     * 
     * ```ts
     * // sync example:
     * const [value, error] = Try.catch(() => {
     *    if (Math.random() < 0.5) {
     *      throw new Error('Uh oh!')
     *    }
     *    return "it works!" 
     * })
     * 
     * if (!error) {
     *    const firstWord = value.split(" ") // type safe!
     * }
     * 
     * // async example:
     * const [user, networkError] = await Try.catch(async () => {
     *    const response = await fetch('https://example.com/users?id=123')
     *    return await response.json()
     * })
     * 
     * if (!networkError) {
     *    console.log(`Hello, ${user.name}!`)
     * } else {
     *    console.warn(`Failed fetching user: ${networkError.message}`)
     * }
     * ```
     */
    static catch<T>(fn: () => never): TryResult<unknown>
    static catch<T>(fn: () => Promise<T>): Promise<TryResult<T>>
    static catch<T>(fn: () => T): TryResult<T>
    static catch<T>(fn: () => T | Promise<T>): TryResult<T> | Promise<TryResult<T>> {
        try {
            const value = fn()
            if (value instanceof Promise) {
                return Try.#handler(() => value, true)
            } else {
                return withResult([value, undefined])
            }
        } catch (e) {
            return withResult([undefined, Try.err(e)])
        }
    }
}
