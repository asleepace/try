import { test, expect } from 'bun:test'
import { Res, Try, tryCatch, TryResult, vet } from '../src/index'

test('Can call with sync function', () => {
  const result = Try.catch(function fn1() {
    return 123
  })
  expect(result).toBeInstanceOf(Res)
  expect(result.value).toBeNumber()
})

test('Can call with async function', async () => {
  const promise = Try.catch(async function fn1() {
    return 123
  })
  expect(promise).toBeInstanceOf(Promise)
  const result = await promise
  expect(result.value).toBeNumber()
})

test('Can call with sync function which returns a resolved promise', async () => {
  const promise = Try.catch(function fn1() {
    return Promise.resolve('item')
  })
  expect(promise).toBeInstanceOf(Promise)
  const result = await promise
  expect(result.value).toBeString()
})

test('Can call with sync function which returns a promise which resolves', async () => {
  const promise = Try.catch(function fn1() {
    return new Promise<boolean>((resolve) => resolve(true))
  })
  expect(promise).toBeInstanceOf(Promise)
  const result = await promise
  expect(result.value).toBeBoolean()
})

test('Can call with function that can return a sync value or promise', async () => {
  function fn1(): boolean | Promise<boolean> {
    return Math.random() < 0.5 ? false : Promise.resolve(true)
  }
  const result = Try.catch(fn1)
  expect(result)
})

test('Can call with function that never returns', async () => {
  function fn1() {
    throw new Error('never')
  }
  const result = Try.catch(fn1)
  expect(result.isErr()).toBe(true)
  expect(result.error?.message).toBe('never')
})

test('Can call with overloaded function and arguments', async () => {
  const safeParse = (json: string) => Try.catch(JSON.parse, json)
  const maybePromise = safeParse('{"data":123}')
  if (maybePromise instanceof Promise) {
    throw new Error('Should not be promise in this test.')
  }
  const result = maybePromise.as<{ data: number }>()
  expect(result.isOk()).toBe(true)
  expect(result.value?.data).toBe(123)
})

test('Can call with different types of sync and async functions', async () => {
  // Test #1 - Sync normal
  function fn1() {
    return 123
  }
  async function fn2() {
    return 123
  }
  function fn3() {
    return Promise.resolve('hello')
  }
  function fn4() {
    return new Promise<boolean>((resolve) => resolve(true))
  }
  function fn5(): boolean | Promise<boolean> {
    return Math.random() < 0.5 ? false : fn4()
  }
  function fn6() {
    throw new Error('never')
  }
  // handle generics
  function fn7<T>(example: () => T) {
    return Try.catch(example)
  }

  const result1 = Try.catch(fn1)
  const result2 = await Try.catch(fn2)
  const result3 = await Try.catch(fn3)
  const result4 = await Try.catch(fn4)
  const result5_1 = await Try.catch(fn5)
  const result5_2 = Try.catch(fn5)
  const result6 = Try.catch(fn6)

  expect(result1.value).toBeNumber()
  expect(result2.value).toBeNumber()
  expect(result3.value).toBeString()
  expect(result4.value).toBeBoolean()
  expect(result5_1.value).toBeBoolean()
  expect(result6.value).toBeUndefined()
  // edge case where output can be sync or async
  if (result5_2 instanceof Promise) {
    expect((await result5_2).value).toBe(true)
  } else {
    expect(result5_2.value).toBe(false)
  }
  expect(fn7(() => 123).value).toBeNumber()
})

// =============================================================
//                    --- Constructor Cases ---
// =============================================================

test('Can call constructors with arguments', () => {
  const result = Try.catch(URL, 'http://asleepace.com/')
  expect(result.value?.href).toBeString()
  expect(result.value?.hostname).toBe('asleepace.com')
})

test('Can call constructors and handle exceptions', () => {
  const result = Try.catch(URL, 'http:\\as lee###pace.com\\')
  expect(result.isErr()).toBe(true)
  expect(result.error).toBeDefined()
})

test('Can call constructors of custom classes', () => {
  class Car {
    constructor(public color: string) {}
  }
  const result = Try.catch(Car, 'blue')
  expect(result.isOk()).toBe(true)
  expect(result.value?.color).toBe('blue')
})

test('Can call constructors which are normal functions', () => {
  const result = Try.catch(Error, 'test')
  expect(result.isOk()).toBe(true)
  expect(result.value).toBeInstanceOf(Error)
  expect(result.value?.message).toBe('test')
})

// =============================================================
//                 --- Try.catch Test Cases ---
// =============================================================

// Can extract values from synchronous functions
test('Try.catch can catch synchronous values', () => {
  const result = Try.catch(() => 123)
  const [value, error] = result
  expect(value).toBe(123)
  expect(error).toBeUndefined()
  expect(result.ok).toBe(true)
  expect(result.isOk()).toBe(true)
  expect(result.isErr()).toBe(false)
  expect(result.value).toBe(123)
  expect(result.unwrap()).toBe(123)
})

// Can catch errors from synchronous functions
test('Try.catch can catch synchronous errors', () => {
  const result = Try.catch(() => {
    throw new Error('error')
    return 456
  })
  const [value, error] = result
  expect(value).toBeUndefined()
  expect(error).toBeDefined()
  expect(error?.message).toBe('error')
  expect(result.ok).toBe(false)
  expect(result.isOk()).toBe(false)
  expect(result.isErr()).toBe(true)
  expect(result.unwrap).toThrowError()
})

// Handle edge case where return type is never
test('Try.catch can catch synchronous errors (edge-case)', () => {
  const result = Try.catch(() => {
    throw new Error('error')
  })
  const [value, error] = result
  expect(value).toBeUndefined()
  expect(error).toBeDefined()
  expect(error?.message).toBe('error')
  expect(result.ok).toBe(false)
  expect(result.isOk()).toBe(false)
  expect(result.isErr()).toBe(true)
  expect(result.unwrap).toThrowError()
})

// Can extract values from async functions
test('Try.catch can catch asynchronous values', async () => {
  const result = await Try.catch(async () => {
    return 456
  })
  const [value, error] = result
  expect(value).toBe(456)
  expect(error).toBeUndefined()
  expect(result.ok).toBe(true)
  expect(result.unwrap()).toBe(456)
  expect(result.isOk()).toBe(true)
  expect(result.isErr()).toBe(false)
})

// Can extract errors from async functions
test('Try.catch can catch asynchronous errors', async () => {
  const [value, error] = await Try.catch(async () => {
    throw new Error('error')
  })
  expect(value).toBeUndefined()
  expect(error).toBeDefined()
  expect(error?.message).toBe('error')
})

// Can handle promise rejections
test('Try.catch can catch promise rejections (async)', async () => {
  const result = await Try.catch(async () => {
    return Promise.reject('error')
  })
  expect(result.value).toBeUndefined()
  expect(result.error).toBeDefined()
  expect(result.error?.message).toBe('error')
})

// Can handle promise resolutions
test('Try.catch can catch promise resolutions (async)', async () => {
  const [value, error] = await Try.catch(async () => {
    return Promise.resolve(789)
  })
  expect(value).toBe(789)
  expect(error).toBeUndefined()
})

// Test handling of non-Error objects thrown
test('Try.catch can handle non-Error objects thrown', () => {
  const [value, error] = Try.catch(() => {
    throw 'string error'
    return 123
  })
  expect(value).toBeUndefined()
  expect(error).toBeDefined()
  expect(error?.message).toBe('string error')
})

// Test handling of null/undefined values
test('Try.catch handles null/undefined values correctly', () => {
  const nullResult = Try.catch(() => null)
  expect(nullResult.ok).toBeTrue()
  expect(nullResult.value).toBeNull()

  const undefinedResult = Try.catch(() => undefined)
  expect(undefinedResult.ok).toBeTrue()
  expect(undefinedResult.value).toBeUndefined()
})

// Test handling falsy values
test('Try.catch handles falsy values correctly', () => {
  const zeroResult = Try.catch(() => 0)
  expect(zeroResult.ok).toBeTrue()
  expect(zeroResult.value).toBe(0)

  const emptyStringResult = Try.catch(() => '')
  expect(emptyStringResult.ok).toBeTrue()
  expect(emptyStringResult.value).toBe('')

  const falseResult = Try.catch(() => false)
  expect(falseResult.ok).toBeTrue()
  expect(falseResult.value).toBe(false)
})

// Test handling of promise rejections with non-Error values
test('Try.catch handles promise rejections with non-Error values', async () => {
  const stringResult = await Try.catch(async () => {
    return Promise.reject('string rejection')
  })
  expect(stringResult.ok).toBeFalse()
  expect(stringResult.error?.message).toBe('string rejection')

  const numberResult = await Try.catch(async () => {
    return Promise.reject(404)
  })
  expect(numberResult.ok).toBeFalse()
  expect(numberResult.error?.message).toBe('404')
})

// Test with complex objects
test('Try.catch with complex objects', () => {
  const complexObj = {
    nested: { value: 42 },
    array: [1, 2, 3],
    fn: () => 'hello',
  }

  const result = Try.catch(() => complexObj)
  expect(result.ok).toBeTrue()
  expect(result.value).toBe(complexObj)
  expect(result.value?.nested.value).toBe(42)
  expect(result.value?.array[1]).toBe(2)
  expect(result.value?.fn()).toBe('hello')
})

// Test with timeout/race conditions
test('Try.catch with timeouts', async () => {
  const result = await Try.catch(async () => {
    return Promise.race([
      new Promise((resolve) => setTimeout(() => resolve('success'), 50)),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 100)
      ),
    ])
  })

  expect(result.ok).toBeTrue()
  expect(result.value).toBe('success')
})

// Test delayed rejections
test('Try.catch with delayed rejections', async () => {
  const result = await Try.catch(async () => {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('delayed error')), 50)
    )
  })

  expect(result.ok).toBeFalse()
  expect(result.error?.message).toBe('delayed error')
})

// Test with recursive Try.catch
test('Try.catch with recursive usage', () => {
  const outer = Try.catch(() => {
    const inner = Try.catch(() => {
      throw new Error('inner error')
    })

    expect(inner.ok).toBeFalse()
    return inner.ok ? 'success' : 'caught inner error'
  })

  expect(outer.ok).toBeTrue()
  expect(outer.value).toBe('caught inner error')
})

// Test with different Error types
test('Try.catch with different Error types', () => {
  const typeError = Try.catch(() => {
    throw new TypeError('type error')
  })
  expect(typeError.ok).toBeFalse()
  expect(typeError.error).toBeInstanceOf(TypeError)

  const syntaxError = Try.catch(() => {
    throw new SyntaxError('syntax error')
  })
  expect(syntaxError.ok).toBeFalse()
  expect(syntaxError.error).toBeInstanceOf(SyntaxError)
})

// Test chaining with .unwrap()
test('Try.catch chaining with unwrap', () => {
  const result = Try.catch(() => 5).unwrap() + 10

  expect(result).toBe(15)

  expect(() => {
    const failResult =
      Try.catch(() => {
        throw new Error('fail')
        return 123
      }).unwrap() + 10
  }).toThrowError()
})

// Test conversion from Try result to Promise
test('Try.catch coerce result to Promise', async () => {
  const successResult = Try.catch(() => 'value')
  const successPromise = Promise.resolve(
    successResult.ok ? successResult.value : Promise.reject(successResult.error)
  )

  await expect(successPromise).resolves.toBe('value')

  const errorResult = Try.catch(() => {
    throw new Error('promise error')
  })
  const errorPromise = Promise.resolve(
    errorResult.ok ? errorResult.value : Promise.reject(errorResult.error)
  )

  await expect(errorPromise).rejects.toThrowError('promise error')
})

// Test handling of async functions that never resolve
test('Try.catch with never-resolving promises with timeout', async () => {
  const timeoutPromise = (promise: Promise<any>, ms: number) => {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), ms)
      ),
    ])
  }

  const result = await Try.catch(async () => {
    return await timeoutPromise(new Promise(() => {}), 100) // never resolves
  })

  expect(result.ok).toBeFalse()
  expect(result.error?.message).toBe('Timeout')
})

// Test with errors thrown in Promise handlers
test('Try.catch with errors in Promise handlers', async () => {
  const result = await Try.catch(async () => {
    return Promise.resolve(42).then((val) => {
      throw new Error('handler error')
    })
  })

  expect(result.ok).toBeFalse()
  expect(result.error?.message).toBe('handler error')
})

// Test with custom error handling logic
test('Try.catch with custom error handler', async () => {
  async function customHandler<T>(fn: () => T): Promise<T | string> {
    const result = Try.catch(fn)

    if (result instanceof Promise) {
      const [value, error] = await result
      return value as T
    }

    if (!result.isOk()) {
      return `Custom handler caught: ${result.error?.message}`
    }
    return result.value
  }

  const success = await customHandler(() => 'success')
  expect(success).toBe('success')

  const failure = await customHandler(() => {
    throw new Error('oops')
  })
  expect(failure).toBe('Custom handler caught: oops')
})

// =============================================================
//                    --- VET Test Cases ---
// =============================================================

test('Can use vet shorthand utility', () => {
  const [url] = vet(() => new URL('https://asleepace.com'))
  expect(url?.href).toBe('https://asleepace.com/')
  const [, err] = vet(() => new URL('https://asleep ace.com'))
  expect(err?.message).toBeDefined()
})

test('Can use vet shorthand utility with or chaining', () => {
  const link = vet(() => new URL('asleepace.com'))
    .or(() => new URL('https://aslee pace.com'))
    .or(() => new URL('https://github.com'))
    .unwrapOr(new URL('https://npm.com'))
  expect(link.href).toBe('https://github.com/')
  expect(link instanceof URL).toBe(true)
})

// =============================================================
//                    --- Res Test Cases ---
// =============================================================

test('Res can be called with instanceof', () => {
  const result = Try.catch(() => 123)
  expect(result instanceof Res).toBe(true)
})

test('Res can be called with toString()', () => {
  const result1 = Try.catch(() => 123)
  expect(result1.toString()).toBe('Result.Ok(123)')
  const result2 = Try.catch(() => {
    throw new Error('456')
  })
  expect(result2.toString()).toBe('Result.Error(456)')
})

test('Res can be instantied with Res.ok<T>', () => {
  const result = Res.ok(true)
  expect(result.ok).toBe(true)
  expect(result.isOk()).toBe(true)
  expect(result.isErr()).toBe(false)
  expect(result.unwrap()).toBe(true)

  const edgeCase1 = Res.ok(undefined)
  expect(edgeCase1.ok).toBe(true)
  expect(edgeCase1.isOk()).toBe(true)
  expect(edgeCase1.isErr()).toBe(false)
  expect(edgeCase1.unwrap()).toBeUndefined()
})

test('Res can call .isOk() and .isErr() methods', async () => {
  let resultError = Try.catch(() => {
    throw new Error('alwaysThrows')
  })
  expect(resultError.isOk()).toBe(false) // should also be type never
  expect(resultError.isErr()).toBe(true)

  let resultValue = Try.catch(() => 123)
  expect(resultValue.isOk()).toBe(true)
  expect(resultValue.isErr()).toBe(false)
})

test('Res can call methods to extract values', () => {
  const result = Try.catch(() => ({
    data: 'hello',
  }))
  expect(result.ok).toBe(true)
  expect(result[0]).toBeDefined()
  expect(result[1]).toBeUndefined()
  expect(result.value).toBeDefined()
  expect(result.error).toBeUndefined()
  if (result.ok) {
    expect(result.value.data).toEqual('hello')
  }
})

test('Res can handle succes values', async () => {
  const result = await Try.catch(async () => ({
    data: 'hello',
  }))
  expect(result.ok).toBe(true)
  expect(result[0]).toBeDefined()
  expect(result[1]).toBeUndefined()
  expect(result.value).toBeDefined()
  expect(result.error).toBeUndefined()
  if (result.ok) {
    expect(result.value.data).toEqual('hello')
  }
})

test('Res can handle error values', () => {
  const result = Try.catch(() => {
    throw new Error('failed')
  })
  expect(result.ok).toBe(false)
  expect(result[0]).toBeUndefined()
  expect(result[1]).toBeDefined()
  expect(result.value).toBeUndefined()
  expect(result.error).toBeDefined()
  if (!result.ok) {
    expect(result.error.message).toBe('failed')
  }
})

test('Res can handle error values (async)', async () => {
  const result = await Try.catch(async () => {
    throw new Error('failed')
  })
  expect(result.ok).toBe(false)
  expect(result[0]).toBeUndefined()
  expect(result[1]).toBeDefined()
  expect(result.value).toBeUndefined()
  expect(result.error).toBeDefined()
  if (!result.ok) {
    expect(result.error.message).toBe('failed')
  }
})

test('Res can call .unwrap() to narrow type or throw', () => {
  const result1 = Try.catch(() => new Date())
  expect(result1.unwrap()).toBeDate()
  const result2 = Try.catch(() => {
    throw new Error('unwrap')
  })
  expect(result2.unwrap).toThrowError()
})

test('Res can call .unwrapOr(fallack) to unwrap a value or fallback', () => {
  const result1 = Try.catch(() => {
    return 123
  })
  expect(result1.unwrapOr('fallback1')).toBe(123)
  const result2 = Try.catch(() => {
    throw new Error('unwrap')
  })
  expect(result2.unwrapOr('fallback2')).toBe('fallback2')
})

// =============================================================
//                    --- tryCatch Cases ---
// =============================================================

test('tryCatch can be used like Try.catch', async () => {
  const result1 = tryCatch(() => 123)
  const result2 = await tryCatch(() => Promise.resolve(456))
  const result3 = await tryCatch(async () => 'test')
  const result4 = tryCatch(() => {
    throw new Error('fail')
  })
  expect(result1.value).toBe(123)
  expect(result2.value).toBe(456)
  expect(result3.value).toBe('test')
  expect(result4.error?.message).toBe('fail')
})

test('tryCatch can be called with sync function and args', () => {
  const result = tryCatch(JSON.stringify, { name: 'Colin' })
  expect(result).toBeInstanceOf(Res)
  expect(result.value).toBeDefined()
  if (result.ok) {
    expect(JSON.parse(result.value).name).toBe('Colin')
  }
})

// =============================================================
//                    --- Edge Cases ---
// =============================================================

test('Edge case where result is error', () => {
  const result = Try.catch(() => new Error('errorAsValue'))
  expect(result.ok).toBeTrue()
  expect(result.value?.message).toBe('errorAsValue')
  expect(result[0]?.message).toBe('errorAsValue')
  expect(result.unwrapOr(new Error('other'))?.message).toBe('errorAsValue')
})

test('Edge case where function never returns', () => {
  const result = Try.catch(() => {})
  expect(result.ok).toBeTrue()
  expect(result.value).toBeUndefined()
})

test('Edge case where async function returns promise', async () => {
  const result = await Try.catch(async () => {
    return new Promise<number>((resolve) => {
      resolve(123)
    })
  })
  expect(result.ok).toBeTrue()
  expect(result.value).toBe(123)
})

test('Edge where we encounters an unexpected error', async () => {
  const result = await Try.catch(async () => {
    const data = { value: null }
    return (data as any).value.callInvalidFunction(123)
  })
  expect(result.ok).toBeFalse()
  expect(result.value).toBeUndefined()
  expect(result.error).toBeDefined()
})
