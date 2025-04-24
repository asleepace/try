# Try 

Type-safe error handling primitives for modern JavaScript & TypeScript projects.

```ts
const [json, error] = Try.catch(() => JSON.parse(data))

// or via async / await ...

const [user, error] = await Try.catch(fetchUser)

if (!error) {
  console.log(`Hello ${user.name}!`) // Type Safe!
}
```


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

```typescript
import { Try } from '@asleepace/try';

// Synchronous error handling
const [result, error] = Try.catch(() => {
  // Your code that might throw an error
  return "success";
});

if (error) {
  console.error("An error occurred:", error.message);
} else {
  console.log("Operation succeeded:", result);
}

// Asynchronous error handling
async function fetchData() {
  const [data, error] = await Try.catch(async () => {
    const response = await fetch('https://api.example.com/data');
    return response.json();
  });
  
  if (error) {
    console.error("Failed to fetch data:", error.message);
    return null;
  }
  
  return data;
}
```

## API

### `Try.catch<T>(fn: () => T | Promise<T>): [T | null, Error | null] | Promise<[T | null, Error | null]>`

Executes a function and returns a tuple containing either:
- `[result, null]` if the function executes successfully
- `[null, error]` if the function throws an error

Works with both synchronous and asynchronous functions, automatically returning a Promise for async operations.

## Benefits

- **No Try/Catch Blocks**: Clean, readable code without nested try/catch structures
- **Type Safety**: Full TypeScript support with proper type inference
- **Consistent Pattern**: Uniform error handling for both sync and async code
- **Zero Dependencies**: Lightweight and dependency-free
- **Isomorphic**: Works in both browser and Node.js environments

## Testing

This package includes a comprehensive test suite. To run the tests:

```bash
# Clone the repository
git clone https://github.com/asleepace/try.git
cd try

# Install dependencies
bun install

# Run tests
bun test
```

## Examples

### Error Handling in a React Component

```tsx
import React, { useEffect, useState } from 'react';
import { Try } from '@asleepace/try';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      
      const [userData, fetchError] = await Try.catch(async () => {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        return response.json();
      });
      
      setUser(userData);
      setError(fetchError);
      setLoading(false);
    }
    
    loadUser();
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

### Chaining Operations

```typescript
import { Try } from '@asleepace/try';

async function processData(rawData) {
  // Step 1: Parse the data
  const [parsed, parseError] = Try.catch(() => JSON.parse(rawData));
  if (parseError) return [null, new Error(`Failed to parse data: ${parseError.message}`)];
  
  // Step 2: Transform the data
  const [transformed, transformError] = Try.catch(() => {
    return parsed.items.map(item => ({
      id: item.id,
      name: item.name.toUpperCase(),
      value: item.value * 2
    }));
  });
  if (transformError) return [null, new Error(`Failed to transform data: ${transformError.message}`)];
  
  // Step 3: Save the data
  const [saved, saveError] = await Try.catch(async () => {
    const response = await fetch('/api/save', {
      method: 'POST',
      body: JSON.stringify(transformed)
    });
    return response.json();
  });
  if (saveError) return [null, new Error(`Failed to save data: ${saveError.message}`)];
  
  return [saved, null];
}
```

## License

MIT
