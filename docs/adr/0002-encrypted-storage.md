# ADR-0002. Encrypted storage with expo-sqlite and SQLCipher

Status: accepted, 2026-09-06

Supersedes the storage choice in section 5 of the specification.

## Context

The specification picks `op-sqlite` over `expo-sqlite` with the reason that
`expo-sqlite` has no encryption. That was true when the specification was
written and is no longer true. `expo-sqlite` supports SQLCipher on Android, iOS
and macOS through a config plugin option.

The requirement itself has not changed: the whole database file is encrypted at
rest with a key that lives in the platform keystore and never leaves the device.

## Decision

Use `expo-sqlite` with SQLCipher.

```json
["expo-sqlite", { "useSQLCipher": true }]
```

The key is applied with `PRAGMA key` as the first statement after opening the
database, before any read or write.

Everything above `src/db/client.ts` talks to repositories and knows nothing
about which SQLite binding is underneath.

## Consequences

One fewer third-party native dependency, and SDK upgrades are not gated on a
third party keeping pace with React Native releases.

SQLCipher is unavailable on web and in Expo Go, which is already true for the
rest of the stack. See ADR-0003.

If a future need appears that `expo-sqlite` cannot serve, moving to `op-sqlite`
touches one file, because no caller depends on the binding.
