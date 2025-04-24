


// Result tuple which contains a value or an error
export type Result<T> = [T, undefined] | [undefined, Error]
export type IsAsync<F> = F extends (...args: any[]) => Promise<any> ? true : false

export class Try {
    static err = (e: unknown) => e instanceof Error ? e : new Error(String(e))

    static _handler<T, Fn extends () => T>(fn: Fn, isAsync?: false): Result<T>
    static _handler<T, Fn extends () => Promise<T>>(fn: Fn, isAsync?: true): Promise<Result<T>>
    static _handler<T, Fn extends () => T>(fn: Fn, isAsync?: true): Promise<Result<T>> | Promise<Result<Promise<T>>>
    static _handler<T, Fn extends () => T>(fn: Fn, isAsync?: boolean): Result<T> | Promise<Result<T>> {
        try {
            const output = fn()
            if (output instanceof Promise) {
                return new Promise(async (resolve) => {
                    try {
                        const value = await output
                        return resolve([value, undefined])
                    } catch (e) {
                        return resolve([undefined, Try.err(e)])
                    }
                })
            } else {
                return [output, undefined]
            }
        } catch (e) {
            return [undefined, Try.err(e)]
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


    static catch<T>(fn: () => never): Result<unknown>
    static catch<T>(fn: () => Promise<T>): Promise<Result<T>>
    static catch<T>(fn: () => T): Result<T>
    static catch<T>(fn: () => T | Promise<T>): Result<T> | Promise<Result<T>> {
        try {
            const value = fn()
            if (value instanceof Promise) {
                return Try._handler(() => value, true)
            } else {
                return [value, undefined] as const
            }
        } catch (e) {
            return [undefined, Try.err(e)] as const
        }
    }
}
