# TypeScript Interop Guide

This guide helps you configure your project for optimal interop with `@asleepace/try`.

## Basic Setup

For most projects, the default configuration works well:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

## Strict Mode Projects

If your project uses strict TypeScript settings, you can extend the strict config:

```json
{
  "extends": "./node_modules/@asleepace/try/tsconfig.strict.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Node.js Projects

For Node.js specific projects, use the Node.js config:

```json
{
  "extends": "./node_modules/@asleepace/try/tsconfig.node.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

## Bundler Compatibility

### Vite

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true
  }
}
```

### Webpack

```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}
```

### Rollup

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "verbatimModuleSyntax": true
  }
}
```

## Common Issues

### Module Resolution

If you encounter module resolution issues, ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

### Type Checking

For stricter type checking, enable these flags:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

## Migration from v0.2.0

The package is fully backward compatible. No changes are required for existing code.

### Deprecation Notice

The `vet` shorthand is deprecated in favor of `tryCatch`. While `vet` still works, it's recommended to migrate to `tryCatch` for better clarity:

```ts
// Old (deprecated)
import { vet } from '@asleepace/try'
const [value, error] = vet(() => someFunction())

// New (recommended)
import { tryCatch } from '@asleepace/try'
const [value, error] = tryCatch(() => someFunction())
```
