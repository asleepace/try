type NonError<T> = T extends Error ? never : T

class Result<T> extends Array {
  declare 0: T extends Error ? undefined : T
  declare 1: T extends Error ? T : undefined

  constructor(result: T) {
    super(2)
    if (result instanceof Error) {
      this[0] = undefined as any
      this[1] = result as any
    } else {
      this[0] = result as any
      this[1] = undefined as any
    }
  }

  get ok(): this extends Result<Error> ? false : true {
    return (this[1] !== undefined) as unknown as any
  }

  get value(): this extends Result<Error> ? undefined : T {
    return this[0] as any
  }

  get error(): this extends Result<Error> ? T : undefined {
    return this[1] as any
  }

  public isOk(): this is Result<NonError<T>> {
    return (this[1] === undefined) as any
  }

  public isErr(): this is Result<Error> {
    return this[1] !== undefined
  }

  public rethrow(): asserts this is Result<NonError<T>> {
    if (this.isErr()) throw this[1]
  }

  public unwrap(): NonError<T> {
    this.rethrow()
    return this[0] as NonError<T>
  }
}

class Try {
  static catch<T, E extends Error>(fn: () => T): Result<T> | Result<E> {
    try {
      const value = fn()
      return new Result<T>(value)
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e))
      return new Result<E>(error as E)
    }
  }
}

const output = Try.catch(() => {
  if (Math.random() < 0.5) throw new Error('Uh oh!')
  return '123'
})

const [value, error] = output

output.rethrow()

const out = output.unwrap()

if (output.isOk()) {
  const unwrappedValue = output.value.charAt(123)
  console.log(output.value.includes('hello')) // Properly typed as string
  console.log(output.error)
}

if (output.isErr()) {
  console.warn(output.error.message)
}

if (output.ok) {
  const value = output.unwrap()
  console.log(output.value.charAt(1))
}

if (!output.ok) {
  typeof output.value
  console.warn(output.error.message)
}
