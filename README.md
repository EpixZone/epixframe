# EpixFrame

Unified communication library for EpixNet sites. Provides the iframe-to-wrapper postMessage bridge, 60+ convenience methods for every EpixNet API command, and a minimal event system.

**8 KB minified**  - zero dependencies.

## Installation

### Script tag (CDN)

```html
<script src="https://cdn.jsdelivr.net/gh/EpixZone/epixframe@v1.0.0/dist/epixframe.min.js"></script>
```

This creates:
- `window.EpixFrame`  - the constructor (for subclassing)
- `window.epixFrame`  - a ready-to-use singleton instance

### ES module

```bash
npm install @epixzone/epixframe
```

```javascript
import { EpixFrame, epixFrame } from '@epixzone/epixframe';
```

### CoffeeScript

```html
<script src="https://cdn.jsdelivr.net/gh/EpixZone/epixframe@v1.0.0/dist/epixframe.min.js"></script>
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

### TypeScript / React

```typescript
import { epixFrame } from '@epixzone/epixframe';

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

Override these in your subclass:

| Method | Description |
|--------|-------------|
| `init()` | Called at the end of the constructor. |
| `onOpenWebsocket()` | Called when wrapper websocket opens. |
| `onCloseWebsocket()` | Called when wrapper websocket closes. |
| `onRequest(cmd, message)` | Called for unhandled wrapper commands (`setSiteInfo`, etc.). |

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
| `getLocalStorage()` | Read site-scoped local storage. |
| `setLocalStorage(data)` | Write site-scoped local storage. |
| `getState()` | Get current wrapper history state. |
| `pushState(state)` | Push history state. |
| `replaceState(state)` | Replace history state. |
| `setViewport(viewport)` | Set viewport meta tag. |
| `setTitle(title)` | Set page title. |
| `notify(type, message, timeout?)` | Show notification (`'info'`, `'done'`, `'error'`). |
| `confirm(message)` | Show confirmation dialog. |
| `prompt(message, type?, placeholder?)` | Show prompt dialog. |
| `openWindow(url)` | Open URL in new window. |
| `innerLoaded()` | Signal that inner frame has loaded. |
| `requestPermission(perm)` | Request wrapper permission. |

### Files

| Method | Description |
|--------|-------------|
| `fileGet(path, opts?)` | Read file contents. `opts`: `{ required, format, timeout }` |
| `fileWrite(path, content)` | Write file (base64 string). |
| `fileDelete(path)` | Delete a file. |
| `fileList(path)` | List files in directory. |
| `fileRules(path)` | Get signing rules for a path. |
| `fileNeed(path, opts?)` | Request file from network. |
| `dirList(path, opts?)` | List directories. |

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
| `xidResolveSite(site)` | Resolve site's canonical xID. |

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
| `feedQuery(params?)` | Query feed items. |
| `feedSearch(query)` | Search feeds. |

### Content filtering

| Method | Description |
|--------|-------------|
| `muteAdd(authAddr, certUserId, reason)` | Mute a user. |
| `muteRemove(authAddr)` | Unmute a user. |
| `muteList()` | List muted users. |

### Optional files

| Method | Description |
|--------|-------------|
| `optionalFilePin(path)` | Pin an optional file. |
| `optionalFileUnpin(path)` | Unpin an optional file. |
| `optionalFileDelete(path)` | Delete an optional file. |
| `optionalFileInfo(path)` | Get optional file info. |
| `optionalFileList(path)` | List optional files. |
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
| `vrfGetBeacon(height)` | Get VRF beacon at block height. |
| `vrfLatestBeacon()` | Get most recent beacon. |
| `vrfDeriveRandom(height, seed, count)` | Derive random values from beacon. |
| `vrfMultiBlockBeacon(endHeight, blocks)` | Combined multi-block randomness. |
| `vrfInvalidateCache()` | Clear local beacon cache. |

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
| `monkeyPatchAjax()` | Patch `XMLHttpRequest` and `fetch` to include the wrapper ajax key. Call this before making any direct HTTP requests. |

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
| `waiting_cb` | `object` | Pending callback map (CoffeeScript compat). |
| `wrapper_nonce` | `string\|null` | Wrapper authentication nonce. |
| `next_message_id` | `number` | Next message ID counter. |

## Building from source

```bash
npm install
npm run dist    # → dist/epixframe.js, dist/epixframe.min.js, dist/epixframe.esm.js
```

## License

MIT
