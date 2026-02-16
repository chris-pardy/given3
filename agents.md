# Given3 — Agent Guide

Instructions for AI agents working on the Given3 codebase.

## Monorepo Structure

Given3 is a pnpm workspace monorepo orchestrated with Turborepo. All packages live under `packages/`.

```
given3/
  package.json          — root scripts (build, test, lint, etc. all delegate to turbo)
  pnpm-workspace.yaml   — declares packages/*
  turbo.json            — task dependency graph
  .nvmrc                — Node version (22)
  packages/
    core/               — @given3/core (foundation library)
    jest/               — @given3/jest (Jest adapter)
    vitest/             — @given3/vitest (Vitest adapter)
    mocha/              — @given3/mocha (Mocha adapter)
    node/               — @given3/node (Node test runner adapter)
    bun/                — @given3/bun (Bun adapter)
    deno/               — @given3/deno (Deno adapter, uses deno.json not package.json)
    examples/           — Example usage
```

## Package Relationships

- `@given3/core` is the foundation. It exports `createGivenLibrary(testHooks)` which all adapters use.
- Each adapter depends on `@given3/core` (via `"@given3/core": "workspace:@given3/core@*"` in package.json).
- Adapters are thin wrappers: they import lifecycle hooks from their framework and pass them to `createGivenLibrary`, then re-export the resulting `given`, `cleanup`, and `createGivenConstructor`.
- The Deno adapter is special: it uses `deno.json` instead of `package.json` and imports `@given3/core` via `npm:@given3/core@^2.1.0`.

## Key Files

| File | Purpose |
|------|---------|
| `packages/core/src/index.mts` | Library factory (`createGivenLibrary`), `GivenProxy`, `GivenMiddleware` type |
| `packages/core/src/given.mts` | Type definitions: `Given<T>`, `GivenConstructor`, `GivenDefinition<T>`, `GivenOptions`, `TestHooks`, `CleanupFunction`, `RegisterCleanupFunction` |
| `packages/core/src/given-impl.mts` | `GivenImpl<T>` class — the actual Given implementation with frame stack |
| `packages/core/src/frames.mts` | Frame types: `EmptyFrame`, `DefineFrame`, `SmartCacheFrame` — cache and dependency tracking |
| `packages/core/src/test-hooks.mts` | `TestHooksImpl` — wraps framework hooks, handles in-test defines |
| `packages/core/src/errors.mts` | `NoDefinitionError`, `CircularReferenceError` |
| `packages/core/src/disposable.mts` | Disposable/AsyncDisposable support utilities |
| `packages/jest/src/index.mts` | Jest adapter entry point |
| `packages/vitest/src/index.mts` | Vitest adapter entry point |
| `packages/mocha/src/index.mts` | Mocha adapter entry point |
| `packages/node/src/index.mts` | Node test runner adapter entry point |
| `packages/bun/src/index.mts` | Bun adapter entry point |
| `packages/deno/mod.ts` | Deno adapter entry point (different convention) |

## Build System

- **Package manager**: pnpm 9.x (see `"packageManager": "pnpm@9.14.2"` in root package.json)
- **Node version**: 22+ (see `.nvmrc` and `"engines": { "node": ">=22" }`)
- **Build orchestration**: Turborepo (`turbo.json`)
- **Build tool**: Each package (except Deno) uses `tsup` to compile `.mts` files to ESM `.js` + `.d.ts` outputs in `dist/`
- **Deno**: No build step; uses `mod.ts` directly with `deno check` for type checking

## Common Commands

All commands are run from the repo root:

```
pnpm build        # Build all packages (turbo build, respects dependency order)
pnpm test         # Run all tests across all packages
pnpm typecheck    # Type-check all packages
pnpm lint         # Lint all packages
pnpm lint:fix     # Lint and auto-fix
pnpm clean        # Remove all dist/ directories
pnpm format       # Format all files with prettier
pnpm precommit    # Runs lint:fix, format, typecheck, and test
```

Individual package commands can be run with:
```
pnpm --filter @given3/core test
pnpm --filter @given3/vitest build
```

Turbo handles dependency ordering: adapters depend on `^build` (core must build first).

## Testing Approach

### Core tests
- Located in `packages/core/`
- Run with Vitest
- Test the core library using the `TestHooks` interface directly (mock hooks)

### Adapter integration tests
- Located in each adapter package (e.g., `packages/vitest/`, `packages/jest/`)
- Use the native test runner for that adapter (Vitest for @given3/vitest, Jest for @given3/jest, etc.)
- Test that the adapter correctly integrates with its framework's lifecycle hooks

### Bun tests
- Run with `bun test` (not Vitest)

### Deno tests
- Located in `packages/deno/tests/`
- Run with `deno test`

### Running all tests
```
pnpm turbo test
```

## How to Add a New Adapter

1. **Create the package directory**: `packages/<name>/`

2. **Create `package.json`**:
   - Name: `@given3/<name>`
   - Set `"type": "module"`
   - Add `@given3/core` as a dependency: `"@given3/core": "workspace:@given3/core@*"`
   - Add the framework as a peerDependency
   - Add build script: `"build": "tsup src/index.mts --format esm --dts --tsconfig tsconfig.build.json"`
   - Add test script appropriate for the framework
   - Add standard scripts: clean, typecheck, lint, lint:fix, format
   - Use `catalog:` references for shared devDependencies (typescript, tsup, eslint, prettier, etc.)

3. **Create `src/index.mts`**:
   ```ts
   import { createGivenLibrary } from "@given3/core";
   import { afterAll, afterEach, beforeAll, beforeEach } from "<framework>";

   export type {
     Given, GivenDefinition, GivenOptions, GivenConstructor,
     GivenMiddleware, CleanupFunction,
   } from "@given3/core";

   export const { createGivenConstructor, cleanup } = createGivenLibrary({
     beforeEach,
     afterEach,
     afterAll,    // some frameworks use `after` instead of `afterAll`
     beforeAll,   // some frameworks use `before` instead of `beforeAll`
   });

   export const given = createGivenConstructor();
   ```

4. **Create `tsconfig.json`** extending the root config and `tsconfig.build.json` for the build.

5. **Add tests**: Create integration tests that verify given/cleanup/define work correctly with the framework's lifecycle.

6. **Verify**: Run `pnpm install` then `pnpm build` and `pnpm test` from the root.

## Architecture Notes

- Given3 uses `AsyncLocalStorage` from `node:async_hooks` for two things:
  1. Dependency tracking — when a Given's definition accesses another Given's `.value`, that access is recorded. This powers the smart cache invalidation.
  2. Cleanup propagation — the standalone `cleanup()` function works by looking up the current cleanup registrar from AsyncLocalStorage.

- The frame stack: each `Given` has a stack of `Frame` objects. `define()` pushes a new frame (in a `beforeAll` hook) and pops it (in an `afterAll` hook). This naturally scopes definitions to describe blocks.

- `SmartCacheFrame` extends `DefineFrame` to add caching with dependency tracking. It maintains a list of cache entries, each with a dependency map. On re-evaluation, it checks if all dependencies still return the same values (by reference). If so, the cached result is returned without running the definition again.

- `TestHooksImpl` handles the edge case where `.define()` is called inside a test (not just in describe blocks). It detects this and runs the hooks immediately rather than registering them with the framework.

## Code Style

- All source files use `.mts` extension (ESM TypeScript)
- The Deno adapter uses `.ts` extension
- Private fields use `#` (ES private fields), not TypeScript `private` keyword
- Types are imported with `import type` where possible
- The project uses ESLint + Prettier for formatting
