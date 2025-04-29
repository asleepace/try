import { test, expect } from 'bun:test'
import { Res, Try, vet } from '../src/index'

// Can use the (vet) shorthand utility
test('Can use vet shorthand utility', () => {
  const [url] = vet(() => new URL('https://asleepace.com'))
  expect(url?.href).toBe('https://asleepace.com/')

  const [, err] = vet(() => new URL('https://asleep ace.com'))
  expect(err?.message).toBeDefined()
})

// Can use the (vet) shorthand utility
test('Can use vet shorthand utility with or chaining', () => {
  const link = vet(() => new URL('asleepace.com'))
    .or(() => new URL('https://aslee pace.com'))
    .or(() => new URL('https://github.com'))
    .unwrapOr(new URL('https://npm.com'))

  expect(link.href).toBe('https://github.com/')
  expect(link instanceof URL).toBe(true)
})

test('Res can call the isOk() and isErr() methods', async () => {
  let resultError = Try.catch(() => {
    throw new Error('alwaysThrows')
  })
  expect(resultError.isOk()).toBe(false) // should also be type never
  expect(resultError.isErr()).toBe(true)

  let resultValue = Try.catch(() => 123)
  expect(resultValue.isOk()).toBe(true)
  expect(resultValue.isErr()).toBe(false)
})

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
  const [value, error] = await Try.catch(async () => {
    return Promise.reject('error')
  })
  expect(value).toBeUndefined()
  expect(error).toBeDefined()
  expect(error?.message).toBe('error')
})

// Can handle promise resolutions
test('Try.catch can catch promise resolutions (async)', async () => {
  const [value, error] = await Try.catch(async () => {
    return Promise.resolve(789)
  })
  expect(value).toBe(789)
  expect(error).toBeUndefined()
})

// Result class tests

test('Result.ok method is true when value is present', () => {
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

test('Result.ok method is true when value is present (async)', async () => {
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

test('Result.ok method is false when error is present', () => {
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

test('Result.ok method is false when error is present (async)', async () => {
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

test('Result.unwrap returns value or throws', () => {
  const result1 = Try.catch(() => {
    return new Date()
  })
  expect(result1.unwrap()).toBeDate()
  const result2 = Try.catch(() => {
    throw new Error('unwrap')
  })
  expect(result2.unwrap).toThrowError()
})

test('Result.unwrapOr returns value or fallback', () => {
  const result1 = Try.catch(() => {
    return 123
  })
  expect(result1.unwrapOr('fallback1')).toBe(123)
  const result2 = Try.catch(() => {
    throw new Error('unwrap')
  })
  expect(result2.unwrapOr('fallback2')).toBe('fallback2')
})

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
test('Recursive Try.catch usage', () => {
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
test('Chaining with unwrap', () => {
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
test('Convert Try result to Promise', async () => {
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
test('Custom error handling with Try', () => {
  function customHandler<T>(fn: () => T): T | string {
    const result = Try.catch(fn)
    if (!result.ok) {
      return `Custom handler caught: ${result.error?.message}`
    }
    return result.value
  }

  const success = customHandler(() => 'success')
  expect(success).toBe('success')

  const failure = customHandler(() => {
    throw new Error('oops')
  })
  expect(failure).toBe('Custom handler caught: oops')
})

test('Can call instanceof on Res class', () => {
  const result = Try.catch(() => 123)
  expect(result instanceof Res).toBe(true)
})

test('Can call toString on Res class', () => {
  const result1 = Try.catch(() => 123)
  expect(result1.toString()).toBe('Result.Ok(123)')
  const result2 = Try.catch(() => {
    throw new Error('456')
  })
  expect(result2.toString()).toBe('Result.Error(Error: 456)')
})

test('Can create result tuple with Res.ok', () => {
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

test('Can handle multiple statements', () => {
  const userInput = ''
  const FALLBACK_URL = new URL('https://example.com')

  const url = Try.catch(() => new URL(userInput))
    .or(() => new URL(`https://${userInput}`))
    .or(() => new URL(`https://${userInput.replace('http://', '')}`))
    .or(() => new URL(`https://${userInput.split('://')[1]!.trim()}`))
    .unwrapOr(new URL(FALLBACK_URL))

  expect(url.href).toBe('https://example.com/')
})

/**
 * Check if caller can specify customer error type.
 *  - Create Error subclass
 *  - Create Fn which can throw custom Error
 *  - Check if the return types are correct
 *  - Can access custom properties
 */
test('Can specify specific type of Error to expect', () => {
  class CustomError extends Error {
    public name = 'MyCustomError'
    public code = 117
    get [Symbol.toStringTag]() {
      console.log('toStringTag called!')
      return 'CustomError'
    }
  }

  function canThrow(): string | never {
    if (Math.random() < 1.0) {
      throw new CustomError()
    } else {
      return 'hello'
    }
  }

  const result = Try.catch<string, CustomError>(canThrow)
  expect(result.ok).toBe(false)
  expect(result.isOk()).toBe(false)
  expect(result.isErr()).toBe(true)
  expect(result.error instanceof CustomError).toBe(true)
  expect(result.error!.code).toBe(117)
  expect(result.toString()).toBe('Result.Error(MyCustomError)')
})
