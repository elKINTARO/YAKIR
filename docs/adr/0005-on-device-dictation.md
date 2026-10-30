# ADR-0005. Dictation is on-device only, and fails closed

Status: accepted, 2026-10-30

## Context

The prediction step offers voice input, because typing is hard during anxiety.
The prediction is also the most private text the app holds, and Phase 1 promises
zero network requests.

`expo-speech-recognition` 57.0.0 has an option `requiresOnDeviceRecognition`, but
reading the native code shows it does not guarantee what its name says:

- iOS sets the flag on the request only when the recogniser for the locale
  supports on-device recognition. When it does not, the audio silently goes to
  Apple's servers.
- Android below 13 ignores the flag and creates the default recogniser, which is
  network based.
- On iOS, JavaScript cannot ask whether a given locale has an on-device model:
  `supportsOnDeviceRecognition()` checks the system locale, and
  `getSupportedLocales()` returns the same list for supported and installed.

## Decision

Dictation never falls back to cloud recognition. When on-device recognition is
not available, the microphone button is hidden and the keyboard remains.

- The library is patched (`patches/expo-speech-recognition@57.0.0.patch`) so
  that iOS always sets `requiresOnDeviceRecognition` on the request. Without an
  on-device model, the task then fails instead of going online.
- The dependency is pinned to the exact version the patch was written against.
- On Android the button is shown only on API 33 or later, when
  `supportsOnDeviceRecognition()` is true and the locale is among
  `installedLocales`.
- An error of `language-not-supported`, `service-not-allowed`, `not-allowed` or
  `network` hides the button for the rest of the screen's life.

The app does not trigger the Android offline model download by itself. That is a
network action, and it belongs behind an explicit choice in settings, not on the
capture path.

## Consequences

On some devices there is no dictation at all. That is the intended trade: a
missing feature is visible, a leak is not.

Every upgrade of `expo-speech-recognition` has to re-check the native code and
re-apply or drop the patch. pnpm fails the install if the pinned version and the
patch disagree, so the upgrade cannot happen by accident.
