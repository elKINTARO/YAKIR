# ADR-0003. Development builds only, no Expo Go

Status: accepted, 2026-09-06

## Context

Three requirements from the specification need native code that Expo Go does not
contain: SQLCipher database encryption, the platform keystore through
`expo-secure-store`, and on-device speech recognition.

## Decision

The project is developed and tested exclusively on a development build, produced
by `expo prebuild` plus `expo run:android` / `expo run:ios`, or by EAS.

The native project folders `apps/mobile/android` and `apps/mobile/ios` are not
committed. They are generated output, and keeping them in the repository turns
every plugin change into a manual merge.

## Consequences

The first thing to verify on a new machine is that a development build installs
and launches, before any feature work. A broken native configuration discovered
halfway through a feature costs far more to untangle.

Web is not a target. The specification never asked for it, and the encryption
guarantee cannot be honoured in a browser.
