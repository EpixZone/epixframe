# Changelog

## 1.1.1

Clears the SonarCloud findings that xites vendoring 1.1.0 hit in their own
quality gates (EpixZone/epixframe#3). No change to what goes on the wire.

### Fixed

- `monkeyPatchAjax()`: an XHR queued until the ajax key arrives is replayed
  in a promise callback, so an exception from the real `open`/`send` there
  became an unhandled rejection. It is now caught and logged
  ("Deferred XHR could not be sent:"), since `send()` has already returned
  to the caller.
- `xidResolveSite()` rejects with an `Error` (message as before). The
  message is still on `.error` too, so callers that read `err.error` keep
  working.

### Changed

- Code-quality cleanups with no behavior change: the "already patched" check
  compares the stored Promise with `null` instead of testing its
  truthiness; the URL-keying helper moved to module scope and lost its nested
  ternary; the XHR replay uses an arrow function and `for...of`; the
  fire-and-forget scroll save on `beforeunload` is marked `void`.

### Added

- Tests for a URL ending in a bare `?`, a queued XHR whose replay throws,
  and the `Error` that `xidResolveSite()` rejects with.
- SonarCloud configuration (`.sonarcloud.properties`): `src/` is analyzed,
  `dist/` is built from it.

## 1.1.0

Fixes found by checking every helper against what the EpixNet node
(`crates/epix-ui/src/command.rs`) and wrapper (`ui/media/all.js`) actually
read and answer.

### Fixed

- `monkeyPatchAjax()`: the fetch patch never added the key (in strict mode
  reassigning the `url` parameter does not change `arguments`, so the original
  URL was forwarded). fetch now builds a new argument list and handles string,
  `URL` and `Request` inputs. The key is added only to requests for the node's
  own host (relative URLs and URLs whose host is `location.host`), so it no
  longer leaks to RPC endpoints or other third-party hosts; XHR has the same
  restriction. Same-host requests made before the wrapper has returned the key
  now wait for it (fetch is delayed, async XHR is queued). Calling it twice no
  longer wraps the patch twice.
- `setLocalStorage(data)` sent `[data]`, so `getLocalStorage()` returned
  `[data]`. It now sends `data` as given; `getLocalStorage()` unwraps a
  one-element array so data stored by 1.0.x still reads back as written.
- `requestPermission(permission)` sent `[permission]`; it now sends the string
  (the wrapper's "already granted" check compares the string).
- `prompt()` put the placeholder in the wrapper's caption slot. The signature
  is now `prompt(message, type, caption, placeholder)`, matching the wrapper.
  Calls with one or two arguments are unchanged.
- `vrfDeriveRandom(beacon, seed, count)`: the first argument is the beacon's
  hex string, not a height, and the result is a plain array of hex strings.
  The VRF types now match the node: `VrfBeacon` is
  `{ height, beacon, proposer, timestamp }`, `VrfDeriveResult` is `string[]`,
  `VrfMultiBlockResult` is `{ beacon }`.
- `dirList(path, opts)` and `optionalFileList()` sent positional arrays whose
  options the node ignores. `dirList` now sends `{ inner_path, ...opts }`
  (e.g. `stats`); `optionalFileList(filterInnerPath, opts)` sends the node's
  named options (`filter_inner_path`, `address`, `filter`, `orderby`,
  `limit`). Previously the argument was ignored and every downloaded optional
  file was returned; a string argument now filters (SQL LIKE pattern).
- `notify`, `setTitle`, `setViewport`, `pushState`, `replaceState`,
  `openWindow` and `innerLoaded` returned Promises that never settled (the
  wrapper does not answer them) and leaked an entry in the pending-callback
  map each. They are now fire-and-forget: nothing is registered and they
  return an already resolved Promise. The scroll-position save on
  `beforeunload` is fire-and-forget too.
- `confirm()` resolved with the number `1`; it now resolves `true` on click.
- ESM build: `epixFrame` was a getter function while the README used it as an
  object, and the types declared a `_singleton` export that does not exist.
  `epixFrame` is now the shared instance itself (lazily created on first use,
  and the same object as the UMD `window.epixFrame`); calling `epixFrame()`
  still returns it. Previously the UMD `window.epixFrame` and the module's
  singleton were two different instances.
- Subclasses that override `onOpenWebsocket`, `onCloseWebsocket` or
  `onRequest` without calling `super` no longer suppress the matching `on()`
  events: the events are emitted after the hook runs.
- `dist/` rebuilt: the three builds were out of sync (the `history_state`
  alias was missing from `dist/epixframe.js` and `dist/epixframe.esm.js`).

### Deprecated

- `xidResolveSite(site)`: the node has no such command. It now logs a warning
  and rejects with an explanatory error. Use `siteInfo().canonical_domain`
  for the current xite's verified domain, or `xidResolveName(name)`.

### Documented

- `feedQuery`, `feedSearch` and `muteList` require the ADMIN permission.
- `requestPermission()` gets no answer when the permission is already granted,
  and `confirm()` gets none when the dialog is dismissed.
- Installation: xites vendor a `dist/` file (they must work offline and over
  Tor); the CDN and npm instructions were removed (the package is not on npm
  yet).

### Added

- Tests (`npm test`) that load the built UMD and ESM files in a fake frame and
  check what each helper puts on the wire.
