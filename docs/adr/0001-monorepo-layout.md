# ADR-0001. Monorepo layout

Status: accepted, 2026-09-06

## Context

Phase 1 ships a client with no backend at all. Phase 2 adds a thin stateless
FastAPI proxy for AI sessions, and both sides have to agree on one request and
response contract. Splitting them into two repositories at that point means
either duplicating the contract by hand or wiring a package publishing step for
a two-person project.

## Decision

One repository, pnpm workspace:

```
apps/mobile        Expo application
services/api       FastAPI proxy, from Phase 2
packages/          shared packages, starting with the generated API contract
docs/adr           these records
```

`node-linker=hoisted` is set in `.npmrc`. Metro does not resolve symlinked
dependencies reliably, and the isolated layout that pnpm uses by default breaks
React Native module resolution.

## Consequences

The paths in section 8 of the specification move under `apps/mobile/`, and the
specification is updated in the same commit.

Metro needs `watchFolders` pointing at the workspace root and `nodeModulesPaths`
covering both the package and the hoisted root store. This is configured in
`apps/mobile/metro.config.js`.

The Python service will not share a dependency manager with the JavaScript side.
That is fine: they share a contract, not a toolchain.
