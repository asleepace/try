# Try

![try-catch-cover](https://github.com/user-attachments/assets/043b452a-56c5-4697-aa79-c5a059c5f6c6)

Type-safe error handling primitives for modern JavaScript & TypeScript projects.

## Installation

Using npm:

```bash
npm install @asleepace/try
```

Using Yarn:

```bash
yarn add @asleepace/try
```

Using Bun:

```bash
bun add @asleepace/try
```

## Quick Start

The goal of this package is to provide concise, type-safe and easy to use tools for handling exceptions.

```ts
import { tryCatch } from '@asleepace/try'

const [url, error] = tryCatch(() => new URL(userInput))

if (error) return console.warn(error.message)

const [response, networkError] = await tryCatch(() => fetch(url))
const [jsonData, parsingError] = await tryCatch(() => response!.json())

if (parsingError) return console.warn(parsingError.message)

return jsonData.userName
```

## Result Type

The `Try.catch(fn)` utility returns a special result type `Res` which is a class that extends a result tuple. The `Res` class provides
some helpful utilities for handling results:

```ts
const result = await Try.catch(() => response.json())

// includes powerful type-guards
if (result.isErr()) return console.warn(result.error.message)

// and convenience methods
const json = result.unwrap()

// supports array destructuring
const [user, error] = await Try.catch(async () => {
  const profileUrl = new URL(json.user!.profile)
  return fetch(profileUrl).then((res) => res.json())
})

if (!error) {
  console.log(`Hello, ${user.name}!`)
} else {
  console.warn(error.message)
}
```

The can be used in conjunction with the array destructuring syntax, which can help if you are only interested in the value or error.

```ts
const result = await Try.catch(() =>
  fetch('https://api.users.com/me')
    .then((res) => res.json())
    .then((usr) => usr as User)
)

console.log(result.value) // User  | undefined
console.log(result.error) // Error | undefined

// automatically narrows the type for you!

if (result.isOk()) {
  const user = result.value // User!
} else {
  const fail = result.error // Error!
}

// in some cases you may just want the value or to throw again:

const user = result.unwrap() // User | never

// or you may want the value or a fallback:

const user = result.unwrapOr(cachedUser) // User
```

## Function Wrapping

You can also wrap existing functions to make them safe:

```ts
import { Try } from '@asleepace/try'

// Wrap built-in functions
const safeParse = Try.wrap(JSON.parse)
const [data, error] = safeParse('{"valid": "json"}')

// Wrap custom functions
const safeDivide = Try.wrap((a: number, b: number) => {
  if (b === 0) throw new Error('Division by zero')
  return a / b
})

const [result, error] = safeDivide(10, 2) // result = 5, error = undefined
const [result2, error2] = safeDivide(10, 0) // result2 = undefined, error2 = Error

// Wrap async functions
const safeFetch = Try.wrap(fetch)
const [response, error] = await safeFetch('https://api.example.com')
```

## API

```ts
Try.catch<T>(fn: () => Promise<T>): Promise<[T, undefined] | [undefined, Error]>
```

Executes a function and returns a tuple containing either:

- `[value, undefined]` if the function executes successfully
- `[undefined, error]` if the function throws an error

Works with both synchronous and asynchronous functions, automatically returning a Promise for async operations.

## Shorthand

This package also exports a shorthand utility called **tryCatch** which provides a more concise way to interact with this api.

```ts
import { tryCatch } from '@asleepace/try'

// Simple usage
const [value] = tryCatch(() => JSON.parse(data))

// Only get the error
const [, error] = tryCatch(() => JSON.parse(data))

// With TypeScript generics for better type inference
const [user] = tryCatch<User>(() => getUserFromAPI())
```

> **Note**: The `vet` shorthand is deprecated and will be removed in a future version. Use `tryCatch` instead.

## Benefits

- **No Try/Catch Blocks**: Clean, readable code without nested try/catch structures
- **Type Safety**: Full TypeScript support with proper type inference
- **Consistent Pattern**: Uniform error handling for both sync and async code
- **Zero Dependencies**: Lightweight and dependency-free
- **Isomorphic**: Works in both browser and Node.js environments
- **Powerful Results**: Type safe, tested and versatile result class

## Testing

This package includes a comprehensive test suite. To run the tests:

```bash
# Clone the repository
git clone https://github.com/asleepace/try.git
cd try

# Install dependencies
bun install

# Build project & generate types
bun run build

# Run tests
bun test
```

## Examples

### Making Network Requests

```ts
// handle synchronous operations which can throw with ease...
const encoded = tryCatch(() => JSON.stringify(userInput))

if (!encoded.ok) return encoded.error

const [response, networkError] = await tryCatch(() =>
  fetch('https://api.com/create', {
    method: 'POST',
    body: encoded.value,
  })
)

if (networkError) return networkError

const [user, jsonError] = await tryCatch(response.json)

if (jsonError) return jsonError

return user
```

### Error Handling in a React Component

```tsx
import React, { useEffect, useState } from 'react'
import { tryCatch } from '@asleepace/try'

function UserProfile({ userId }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadUser() {
      setLoading(true)

      const [userData, fetchError] = await tryCatch(async () => {
        const response = await fetch(`/api/users/${userId}`)
        if (!response.ok) throw new Error(`HTTP error ${response.status}`)
        return response.json()
      })

      setUser(userData)
      setError(fetchError)
      setLoading(false)
    }

    loadUser()
  }, [userId])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  )
}
```

### Chaining Operations

```ts
import { Try } from '@asleepace/try'

async function processData(rawData): object | undefined {
  // Step 1: Parse the data
  const [parsed, parseError] = Try.catch(() => JSON.parse(rawData))
  if (parseError) return console.warn(parseError.message)

  // Step 2: Transform the data
  const [transformed, transformError] = Try.catch(() => {
    return parsed.items.map((item) => ({
      id: item.id,
      name: item.name.toUpperCase(),
      value: item.value * 2,
    }))
  })
  if (transformError) return console.warn(transformError.message)

  // Step 3: Save the data
  const saveResult = await Try.catch(async () => {
    const response = await fetch('/api/save', {
      body: JSON.stringify(transformed),
      method: 'POST',
    })
    return response.json()
  })

  if (saveResult.isErr()) return console.warn(saveResult.error)
  return saveResult.unwrap()
}
```

# Specification

## Overview

The `Try.catch` utility provides a type-safe way to handle errors in both synchronous and asynchronous functions, returning a result tuple that contains either a value or an error, but never both.

## Return Values

- `Try.catch` always returns either a `ResultOk<T>` or `ResultError` type, which extends the tuple types `[T, undefined]` or `[undefined, Error]` respectively.
- The returned object is guaranteed to have exactly two elements, with either index 0 or index 1 being undefined.
- If the function completes successfully, index 0 will contain the return value and index 1 will be undefined.
- If the function throws an error, index 0 will be undefined and index 1 will contain the error.

## Error Handling

- If a non-Error value is thrown (such as a string, number, or object), it will be automatically converted to an instance of the built-in `Error` class.
- Thrown values that aren't already errors will first be coerced to strings and then used to construct a new `Error` instance.
- If the function returns an `Error` object as its value (not thrown), it will be treated as a successful result with the `Error` as the value at index 0, not as an error case.

## Properties and Methods

The returned result object includes several convenience properties and methods:

- `.value`: Returns the value at index 0 (the success value) or undefined if an error occurred.
- `.error`: Returns the error at index 1 or undefined if the operation was successful.
- `.ok`: A boolean property that is `true` when `.error === undefined` and `false` otherwise.
- `.unwrap()`: Returns the value if present, or throws the captured error if no value is present.
- `.unwrapOr(fallback)`: Returns the value if present, or the provided fallback value if no value is present.
- `.toString()`: Returns a string representation of the result, displaying either the successful value or the error message.

## Type Safety

- The returned result type correctly narrows in type-guard contexts:
  - When checking `if (result.ok)`, TypeScript will narrow the type to `ResultOk<T>`.
  - When checking `if (!result.ok)`, TypeScript will narrow the type to `ResultError`.
- In `ResultOk<T>` contexts, `result.value` is typed as `T` and `result.error` is typed as `undefined`.
- In `ResultError` contexts, `result.value` is typed as `undefined` and `result.error` is typed as `Error`.

## Async Support

- `Try.catch` supports both synchronous and asynchronous functions.
- When passed a function that returns a Promise, `Try.catch` returns a Promise that resolves to a result tuple.
- Rejected promises are captured and converted to error results, following the same rules as thrown errors.

## Instanceof Support

- The returned result object is an instance of `TryResultClass`, enabling `instanceof` checks.
- This allows for easier type checking and integration with existing code patterns.

# TypeScript Configuration

This package is designed to work with various TypeScript configurations. For optimal interop, ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

For strict mode projects, see [INTEROP.md](./INTEROP.md) for detailed configuration options.

# Changelog

## 0.2.2

- Improved TypeScript interop with better module resolution
- Added `exports` field for better bundler compatibility
- Enhanced type definitions with better JSDoc comments
- Added separate TypeScript configs for different environments
- Improved error handling and type safety
- Deprecated `vet` shorthand in favor of `tryCatch`
- Added `Try.wrap` for creating safe function wrappers

## 0.2.1

- add `Res.ok(value)` and `Res.err(error)` initializers
- add `isOk()` and `isErr()` type guards to result
- move all code into `src/index.ts`
- remove junks files and reduce package size
- remove internal `Try.#handler` method
- simplify `Try.catch` logic
- simplify types

## 0.2.0

- add `vet(fn)` shorthand (deprecated in 0.2.2, use `tryCatch` instead)
- add convenience methods
- Update `Result` class
- Update test suite

## 0.14.0

- Update `README.md`
- Update `Try.catch` functionality

## 0.13.0

- Initial release

## License

MIT
