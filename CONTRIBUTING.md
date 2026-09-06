# Contributing

[CLAUDE.md](CLAUDE.md) is the specification and it outranks the code. If an
implementation and the specification disagree, one of them is wrong, and the
same pull request fixes it. Architectural decisions that depart from the
specification live in [docs/adr/](docs/adr/).

## Setup

```sh
pnpm install
pnpm --filter @yakir/mobile exec expo run:android
```

Expo Go is not used. SQLCipher, the platform keystore and on-device speech
recognition all need native code, so development happens on a development
build. See [ADR-0003](docs/adr/0003-development-build-only.md).

Git hooks run in a shell that does not read your profile, so if `pnpm` lives
outside the system path the hooks fail with `pnpm: command not found`. Husky
sources `~/.config/husky/init.sh` before every hook; put the path there:

```sh
export PNPM_HOME="$HOME/Library/pnpm"
export PATH="$PNPM_HOME/bin:$PATH"
```

## Branches

`main` holds releases only, each merge tagged `vX.Y.Z`. `develop` is the
integration branch. Everything else is short lived and branches from `develop`:

| Prefix     | For                                                         |
| ---------- | ----------------------------------------------------------- |
| `feature/` | new behaviour                                               |
| `fix/`     | defects found in `develop`                                  |
| `chore/`   | tooling, dependencies, configuration                        |
| `release/` | version bump, changelog, final checks                       |
| `hotfix/`  | branches from `main`, merges back into `main` and `develop` |

Feature, fix and chore branches are squash merged into `develop`. Release and
hotfix branches are merged into `main` with a merge commit, so the branch stays
visible in the history, then tagged and merged back into `develop`.

## Commits

Conventional Commits, English, imperative, lower case after the colon.

```
feat(capture): persist the episode with timezone offset and lock it
```

Allowed types and scopes are enforced by [commitlint.config.js](commitlint.config.js);
the commit is rejected locally if it does not match. Pull request titles follow
the same format and are checked in CI.

## Before opening a pull request

```sh
pnpm typecheck
pnpm lint
pnpm test
```

The domain layer under `apps/mobile/src/domain` must stay at full coverage. That
is where follow-up scheduling and calibration live, and a wrong number there is
not a rendering bug: the user reads it as a fact about their own life.

## Rules the review checks

Three things are never traded away, and a pull request that touches them needs
an explicit justification in its description:

1. Entry data never leaves the device in the clear.
2. A prediction cannot be edited after it is created.
3. The app never calls itself therapy, never diagnoses, never guarantees an
   outcome.

Two structural rules are enforced by lint rather than by review:

- `src/domain` imports no React, React Native, Expo, storage or UI. It is tested
  without an emulator, and that only stays true if nothing pulls a device
  dependency into it.
- Screens reach storage through `src/db/repositories`, never through the
  database client directly.

Section 3 of the specification lists features that are deliberately not built.
Streaks, symptom checklists, an unlimited chat and re-engagement notifications
are not oversights. Each of them feeds the cycle the app exists to interrupt.
