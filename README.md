# EpixFrame

Unified communication library for EpixNet sites. Provides the iframe-to-wrapper postMessage bridge, 60+ convenience methods for every EpixNet API command, and a minimal event system.

**12 KB minified**, zero dependencies. Version 1.1.1 (see [CHANGELOG.md](CHANGELOG.md)).

## Installation

Xites must work offline and over Tor, so they vendor their libraries instead
of loading them from a CDN. Download a build from this repository's `dist/`
folder (pick the release tag you want) and commit it into your xite:

| File | Use |
|------|-----|
| `dist/epixframe.min.js` | Script tag (minified UMD). Recommended. |
| `dist/epixframe.js` | Script tag (readable UMD). |
| `dist/epixframe.esm.js` | ES module (`<script type="module">` or a bundler). |

For example, save `dist/epixframe.min.js` as `js/lib/epixframe.min.js` in
your xite and sign it with the rest of the xite's files.

The package is not published on npm yet (publication as `@epixzone/epixframe`
is planned); until then, vendor the file as above.

### Script tag

```html
<script src="js/lib/epixframe.min.js"></script>
```

This creates:
- `window.EpixFrame`  - the constructor (for subclassing)
- `window.epixFrame`  - the shared instance, created on first use

### ES module

```javascript
import { EpixFrame, epixFrame } from './js/lib/epixframe.esm.js';

const info = await epixFrame.siteInfo();
```

`epixFrame` is the shared instance (the same object as `window.epixFrame` in
the script-tag build), created lazily on first use. For code written against
1.0.x, calling it as a function (`epixFrame()`) still returns that instance.

### CoffeeScript

```html
<script src="js/lib/epixframe.min.js"></script>
```

```coffeescript
class EpixTalk extends EpixFrame
  onOpenWebsocket: ->
    @cmd "serverInfo", {}, (ret) =>
      @server_info = ret
```

## Quick start

### Simple site

```html
<script src="epixframe.min.js"></script>
<script>
  epixFrame.on('openWebsocket', async function () {
    var info = await epixFrame.siteInfo();
    document.title = info.content.title;
  });
</script>
```

### Subclass pattern (CoffeeScript)

```coffeescript
class MyApp extends EpixFrame
  init: ->
    # Called at construction time

  onOpenWebsocket: ->
    @cmd "siteInfo", {}, (site) =>
      @site_info = site
      @loadContent()

  onRequest: (cmd, message) ->
    if cmd == "setSiteInfo"
      @site_info = message.params
      @updateUI()
    else
      @log "Unknown", cmd
```

Overriding a hook does not silence the matching event: `openWebsocket`,
`closeWebsocket` and `request` are emitted after the hook runs, whether or not
the override calls `super`.

### TypeScript / React

```typescript
import { epixFrame } from './js/lib/epixframe.esm.js';

async function loadPosts() {
  const rows = await epixFrame.dbQuery(
    'SELECT * FROM topic ORDER BY added_at DESC LIMIT ?', { limit: 20 }
  );
  return rows;
}
```

## API Reference

### Core

| Method | Returns | Description |
|--------|---------|-------------|
| `cmd(name, params?, cb?)` | `Promise<any>` or `void` | Send command to wrapper. Returns Promise when no callback provided. |
| `response(to, result)` | `void` | Respond to a wrapper request by message ID. |
| `log(...args)` | `void` | Console log with `[EpixFrame]` prefix. |

### Lifecycle hooks

Override these in your subclass (calling `super` is optional; the matching
event is emitted either way):

| Method | Description |
|--------|-------------|
| `init()` | Called at the end of the constructor. |
| `onOpenWebsocket()` | Called when wrapper websocket opens, then `openWebsocket` is emitted. |
| `onCloseWebsocket()` | Called when wrapper websocket closes, then `closeWebsocket` is emitted. |
| `onRequest(cmd, message)` | Called for unhandled wrapper commands (`setSiteInfo`, etc.), then `request` is emitted. |

### Events

```javascript
epixFrame.on('openWebsocket', function () { /* ... */ });
epixFrame.once('openWebsocket', fn);
epixFrame.off('openWebsocket', fn);
epixFrame.off('openWebsocket'); // remove all
```

Events: `openWebsocket`, `closeWebsocket`, `request`.

### Wrapper

| Method | Description |
|--------|-------------|
| `serverInfo()` | Server configuration and version. |
| `siteInfo()` | Current site info (address, peers, settings). |
| `getLocalStorage()` | Read site-scoped local storage (data written by 1.0.x, wrapped in a one-element array, is unwrapped). |
| `setLocalStorage(data)` | Write site-scoped local storage; `data` is stored as given. |
| `getState()` | Get current wrapper history state. |
| `pushState(state)` | Push history state. Fire-and-forget. |
| `replaceState(state)` | Replace history state. Fire-and-forget. |
| `setViewport(viewport)` | Set viewport meta tag. Fire-and-forget. |
| `setTitle(title)` | Set page title. Fire-and-forget. |
| `notify(type, message, timeout?)` | Show notification (`'info'`, `'done'`, `'error'`). Fire-and-forget. |
| `confirm(message)` | Show confirmation dialog. Resolves `true` on click; dismissing it sends no answer (stays pending). |
| `prompt(message, type?, caption?, placeholder?)` | Show prompt dialog. `type` defaults to `'text'`, `caption` (button label) to `'OK'`. Resolves with the text. |
| `openWindow(url)` | Open URL in new window. Fire-and-forget. |
| `innerLoaded()` | Signal that inner frame has loaded. Fire-and-forget. |
| `requestPermission(perm)` | Request a permission (e.g. `'ADMIN'`, `'Merger:EpixPost'`). If already granted the wrapper sends no answer, so check `siteInfo().settings.permissions` first. |

Fire-and-forget methods: the wrapper never answers these commands, so they
register no callback and return a Promise that is already resolved once the
message is posted.

### Files

| Method | Description |
|--------|-------------|
| `fileGet(path, opts?)` | Read file contents. `opts`: `{ required, format, timeout }` |
| `fileWrite(path, content)` | Write file (base64 string). |
| `fileDelete(path)` | Delete a file. |
| `fileList(path)` | List files in directory. |
| `fileRules(path)` | Get signing rules for a path. |
| `fileNeed(path, opts?)` | Request file from network. |
| `dirList(path, opts?)` | List a directory's entries (names). With `{ stats: true }`: `[{ name, is_dir, size }]`. |

### Database

| Method | Description |
|--------|-------------|
| `dbQuery(query, params?)` | Execute SQL query on site's merged database. |

### Site management

| Method | Description |
|--------|-------------|
| `siteSign(privatekey?, innerPath?, opts?)` | Sign site content. |
| `sitePublish(privatekey?, innerPath?, opts?)` | Sign and publish. |

### Identity (xID)

| Method | Description |
|--------|-------------|
| `certSelect()` | Open the xID certificate selector. |
| `xidResolve(address)` | Resolve address to xID name. |
| `xidResolveName(name)` | Resolve xID name to address. |
| `xidResolveBatch(addresses)` | Batch resolve addresses. |
| `xidResolveIdentity(address)` | Full identity lookup. |
| `xidResolveSite(site)` | **Deprecated**: the node has no such command, so this logs a warning and rejects. Use `siteInfo().canonical_domain` for the current xite, or `xidResolveName(name)`. |

### Encryption / Signing

| Method | Description |
|--------|-------------|
| `encrypt(text, publickey?)` | ECIES encrypt. |
| `decrypt(text)` | ECIES decrypt with user's key. |
| `sign(text)` | ECDSA sign. |
| `verify(text, address, signature)` | ECDSA verify. |
| `getPublicKey(index?)` | Get user's public key. |
| `pubToAddr(pubkey)` | Convert public key to address. |

### Feed / Newsfeed

| Method | Description |
|--------|-------------|
| `feedFollow(feeds)` | Set followed feeds. |
| `feedList()` | List followed feeds. |
| `feedQuery(params?)` | Query feed items. **Requires ADMIN.** |
| `feedSearch(query)` | Search feeds. **Requires ADMIN.** |

### Content filtering

| Method | Description |
|--------|-------------|
| `muteAdd(authAddr, certUserId, reason)` | Mute a user. |
| `muteRemove(authAddr)` | Unmute a user. |
| `muteList()` | List muted users. **Requires ADMIN.** |

### Optional files

| Method | Description |
|--------|-------------|
| `optionalFilePin(path)` | Pin an optional file. |
| `optionalFileUnpin(path)` | Unpin an optional file. |
| `optionalFileDelete(path)` | Delete an optional file. |
| `optionalFileInfo(path)` | Get optional file info. |
| `optionalFileList(filterInnerPath?, opts?)` | List optional files. `filterInnerPath` is a SQL LIKE pattern (`'data/videos/%'`). `opts`: `{ address, filter, orderby, limit }` (`filter` defaults to `'downloaded'`). An options object may be the only argument. |
| `optionalHelp(dir, title, addr?)` | Help distribute optional files. |
| `optionalHelpRemove(dir, addr?)` | Stop helping distribute. |

### Merger sites

| Method | Description |
|--------|-------------|
| `mergerSiteAdd(addresses)` | Add merger sub-site(s). |
| `mergerSiteDelete(address)` | Remove merger sub-site. |
| `mergerSiteList(querySiteInfo?)` | List merger sub-sites. |

### VRF beacon

| Method | Description |
|--------|-------------|
| `vrfGetBeacon(height)` | Beacon at a block height: `{ height, beacon, proposer, timestamp }`. |
| `vrfLatestBeacon()` | Most recent beacon, same shape. |
| `vrfDeriveRandom(beacon, seed, count)` | `count` hex values from a beacon's hex `beacon` string: `value[i] = sha256(beacon + seed + i)`. Resolves with a plain array. |
| `vrfMultiBlockBeacon(endHeight, blocks)` | Beacon combined over `blocks` blocks (1 to 256) ending at `endHeight`: `{ beacon }`. |
| `vrfInvalidateCache()` | No-op on the current node (it keeps no beacon cache); resolves `'ok'`. |

```javascript
const b = await epixFrame.vrfLatestBeacon();
const [roll] = await epixFrame.vrfDeriveRandom(b.beacon, 'dice-42', 1);
```

### Chain RPC URLs

| Method | Description |
|--------|-------------|
| `chainRpcUrl()` | Get the Cosmos REST API URL from EpixNet config. |
| `chainEvmRpcUrl()` | Get the EVM JSON-RPC URL from EpixNet config. |
| `chainBlockExplorerUrl()` | Get the block explorer URL from EpixNet config. |

These methods fetch from `serverInfo` and cache the result. Use them instead of hardcoding RPC URLs.

### Ajax

| Method | Description |
|--------|-------------|
| `monkeyPatchAjax()` | Patch `XMLHttpRequest` and `fetch` to add the xite's ajax key to requests for the node's own host (relative URLs and URLs whose host is `location.host`). Other hosts never get the key. Same-host requests made before the key arrives wait for it. Resolves once the key is known; safe to call more than once. |

In a sandboxed xite frame, reading the xite's own files with `fetch` or `XHR`
needs the ajax key, so call `monkeyPatchAjax()` once at startup.

## Dual API: Promises and callbacks

Every command supports both styles:

```javascript
// Promise
var info = await epixFrame.siteInfo();

// Callback
epixFrame.cmd('siteInfo', {}, function (info) {
  console.log(info);
});
```

In **Promise mode**, if the result contains an `error` property, the Promise rejects. In **callback mode**, the result is passed as-is (backward compatible with CoffeeScript sites that check errors themselves).

## CoffeeScript migration guide

If your site currently uses `Class.coffee` + `EpixFrame.coffee`:

1. **Remove** `Class.coffee` and `EpixFrame.coffee` from your build
2. **Add** the EpixFrame script tag before your app script:
   ```html
   <script src="js/epixframe.min.js"></script>
   ```
3. **Change** your app class to extend `EpixFrame`:
   ```coffeescript
   # Before
   class EpixTalk extends Class

   # After
   class EpixTalk extends EpixFrame
   ```
4. **Replace** `@cmd "wrapperXxx"` calls with convenience methods where desired (optional  - raw `cmd()` still works):
   ```coffeescript
   # Before
   @cmd "wrapperNotification", ["info", "Hello"]
   # After (optional)
   @notify "info", "Hello"
   ```

The `cmd()` method signature is fully backward compatible. `@log()` still works. `waiting_cb`, `wrapper_nonce`, and `next_message_id` are still accessible as instance properties.

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `isEmbedded` | `boolean` | `true` if running inside EpixNet wrapper. |
| `url` | `string\|null` | URL passed to constructor. |
| `waiting_cb` | `object` | Pending callback map (CoffeeScript compat). Fire-and-forget methods add nothing to it. |
| `wrapper_nonce` | `string\|null` | Wrapper authentication nonce. |
| `next_message_id` | `number` | Next message ID counter. |

## Building from source

```bash
npm install
npm run dist    # dist/epixframe.js, dist/epixframe.min.js, dist/epixframe.esm.js
npm test        # node --test against the built dist/ files
```

Commit the rebuilt `dist/` files with every source change: xites vendor them
directly.

## License

MIT
