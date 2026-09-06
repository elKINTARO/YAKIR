# ADR-0004. Testing strategy

Status: accepted, 2026-09-06

## Context

The specification asks for full test coverage of `src/domain`, and names vitest
with `@testing-library/react-native`. Those two tools sit at different levels.
The domain layer is pure TypeScript with no React in it, which vitest runs
directly and quickly. Driving React Native components through vitest, on the
other hand, needs a fragile transform stack that breaks on every renderer
change.

## Decision

Vitest covers `src/domain` and any other pure module, with a hundred percent
threshold enforced in CI on that path only.

Screens are not unit tested. Logic that deserves a test is moved out of the
screen and into `src/domain`, which is the same reason the layer exists. Flows
are checked on a development build, and later with Maestro once the flows are
stable enough to be worth recording.

## Consequences

The coverage number stays meaningful. A gate that covers presentational code
gets satisfied with tests that assert nothing, and then nobody trusts it.

The pressure to keep screens thin becomes structural rather than a matter of
discipline: logic left in a screen is logic nothing verifies.

Follow-up scheduling and calibration are tested against a fixed clock, never
against the real one.
