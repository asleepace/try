import { test, expect } from 'bun:test'
import { Try } from '../src/index'

// Can extract valurs from synchronous functions
test('Try.catch can catch synchronous values', () => {
  const [value, error] = Try.catch(() => 123)
  expect(value).toBe(123)
  expect(error).toBeUndefined()
})

// Can catch errors from synchronous functions
test('Try.catch can catch synchronous errors', () => {
  const [value, error] = Try.catch(() => {
    throw new Error('error')
    return 456
  })
  expect(value).toBeUndefined()
  expect(error).toBeDefined()
  expect(error?.message).toBe('error')
})

// Handle edge case where return type is never
test('Try.catch can catch synchronous errors (edge-case)', () => {
  const [value, error] = Try.catch(() => {
    throw new Error('error')
  })
  expect(value).toBeUndefined()
  expect(error).toBeDefined()
  expect(error?.message).toBe('error')
})

// Can extract values from async functions
test('Try.catch can catch asynchronous values', async () => {
  const [value, error] = await Try.catch(async () => {
    return 456
  })
  expect(value).toBe(456)
  expect(error).toBeUndefined()
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
