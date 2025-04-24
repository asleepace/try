


// Result tuple which contains a value or an error
export type Result<T> = [T, undefined] | [undefined, Error]

export class Try {
    static err = (e: unknown) => e instanceof Error ? e : new Error(String(e))

    static _handler<T, Fn extends () => T>(fn: Fn, isAsync?: false): Result<T>
    static _handler<T, Fn extends () => T>(fn: Fn, isAsync?: true): Promise<Result<T>>
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

    static catch<T>(fn: () => Promise<T>): Promise<[T, undefined]> | Promise<[undefined, Error]>
    static catch<T>(fn: () => T): [T, undefined] | [undefined, Error]
    static catch<T>(fn: () => T | Promise<T>) {
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
