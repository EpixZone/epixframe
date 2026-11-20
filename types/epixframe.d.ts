/**
 * EpixFrame  - Unified communication library for EpixNet sites.
 *
 * @license MIT
 * @version 1.1.0
 */

export interface ServerInfo {
  ip_external: string;
  platform: string;
  fileserver_ip: string;
  fileserver_port: number;
  tor_enabled: boolean;
  tor_status: string;
  tor_has_meek_bridges: boolean;
  ui_ip: string;
  ui_port: number;
  version: string;
  rev: number;
  timecorrection: number;
  language: string;
  debug: boolean;
  offline: boolean;
  plugins: string[];
  plugins_rev: Record<string, number>;
  user_settings: Record<string, any>;
  lib_verify_best: string;
  updatesite: string;
  dist_type: string;
  chain_rpc_url: string;
  chain_evm_rpc_url: string;
  chain_block_explorer_url: string;
  [key: string]: any;
}

export interface SiteInfo {
  address: string;
  address_hash: string;
  address_short: string;
  cert_user_id: string | null;
  xid_directory: string | null;
  auth_address: string;
  content: ContentInfo;
  peers: number;
  peers_seed: number;
  settings: SiteSettings;
  size_limit: number;
  next_size_limit: number;
  started_task_num: number;
  tasks: number;
  workers: number;
  bad_files: number;
  event: string[];
  [key: string]: any;
}

export interface ContentInfo {
  address: string;
  title: string;
  description: string;
  files: number;
  includes: number;
  modified: number;
  signs_required: number;
  signers_sign: string;
  [key: string]: any;
}

export interface SiteSettings {
  added: number;
  bytes_recv: number;
  bytes_sent: number;
  cache: Record<string, any>;
  peers: number;
  serving: boolean;
  size: number;
  size_optional: number;
  [key: string]: any;
}

export interface FileRules {
  current_size: number;
  max_size: number;
  signers: string[];
  signs_required: number;
  user_address?: string;
  cert_signers?: Record<string, string[]>;
  [key: string]: any;
}

export interface FileGetOptions {
  required?: boolean;
  format?: 'text' | 'base64';
  timeout?: number;
}

export interface FileNeedOptions {
  timeout?: number;
  priority?: number;
}

/** A block's randomness beacon, as returned by vrfGetBeacon / vrfLatestBeacon. */
export interface VrfBeacon {
  /** Block height. */
  height: number;
  /** The beacon value (hex). Pass this to vrfDeriveRandom. */
  beacon: string;
  /** The block proposer. */
  proposer: string;
  /** Block time. */
  timestamp: number;
}

/** vrfDeriveRandom's result: `count` 32-byte hex values. */
export type VrfDeriveResult = string[];

/** vrfMultiBlockBeacon's result: one beacon combined over the window. */
export interface VrfMultiBlockResult {
  /** The combined beacon value (hex). */
  beacon: string;
}

/** dirList entry when called with `{ stats: true }`. */
export interface DirEntry {
  name: string;
  is_dir: boolean;
  size: number;
  [key: string]: any;
}

export interface OptionalFileListOptions {
  /** Another xite's address (requires permission for it). */
  address?: string;
  /** Comma list, e.g. 'downloaded' (default) or 'downloaded,bigfile'. */
  filter?: string;
  /** SQL LIKE pattern on the inner path, e.g. 'data/videos/%'. */
  filter_inner_path?: string;
  /** Default 'time_downloaded DESC'. */
  orderby?: string;
  /** 0 or omitted: no limit. */
  limit?: number;
  [key: string]: any;
}

export interface FeedQueryParams {
  limit?: number;
  offset?: number;
  day_limit?: number;
  [key: string]: any;
}

export interface FeedItem {
  type: string;
  date_added: number;
  title: string;
  body: string;
  url: string;
  site: string;
  [key: string]: any;
}

export type EpixFrameEventMap = {
  openWebsocket: () => void;
  closeWebsocket: () => void;
  request: (cmd: string, message: any) => void;
  [event: string]: (...args: any[]) => void;
};

/**
 * EpixFrame  - the core communication class for EpixNet sites.
 *
 * Can be used directly (`new EpixFrame()`) or subclassed
 * (CoffeeScript `class MyApp extends EpixFrame`).
 */
export declare class EpixFrame {
  /** URL of the current page (if provided). */
  url: string | null;

  /** Whether the frame is connected to the wrapper. */
  readonly isEmbedded: boolean;

  // CoffeeScript backward-compat properties
  waiting_cb: Record<number, any>;
  next_message_id: number;
  wrapper_nonce: string | null;
  target: Window | null;

  constructor(url?: string);

  // ---------------------------------------------------------------------------
  // Overridable hooks
  // ---------------------------------------------------------------------------

  /** Called at the end of the constructor. Override for custom init logic. */
  init(): this;

  /**
   * Called when the wrapper websocket opens. The 'openWebsocket' event is
   * emitted after it whether or not an override calls super.
   */
  onOpenWebsocket(): void;

  /** Called when the wrapper websocket closes; then 'closeWebsocket' is emitted. */
  onCloseWebsocket(): void;

  /** Called for unhandled wrapper commands; then 'request' is emitted. */
  onRequest(cmd: string, message: any): void;

  // ---------------------------------------------------------------------------
  // Core communication
  // ---------------------------------------------------------------------------

  /**
   * Send a command to the EpixNet wrapper.
   *
   * @overload Promise mode  - returns a Promise when no callback is provided.
   * @overload Callback mode  - invokes `cb(result)` when the wrapper responds.
   */
  cmd(cmd: string): Promise<any>;
  cmd(cmd: string, params: any): Promise<any>;
  cmd(cmd: string, cb: (result: any) => void): void;
  cmd(cmd: string, params: any, cb: (result: any) => void): void;

  /** Respond to a wrapper request by message id. */
  response(to: number, result: any): void;

  /** Log with [ClassName] prefix. Subclasses get their own name. */
  log(...args: any[]): void;

  /** Start a named timer for performance logging. */
  logStart(name: string, ...args: any[]): void;

  /** End a named timer and log elapsed time in ms. */
  logEnd(name: string, ...args: any[]): void;

  // ---------------------------------------------------------------------------
  // Event system
  // ---------------------------------------------------------------------------

  /** Add a listener for the given event. */
  on<K extends keyof EpixFrameEventMap>(event: K, fn: EpixFrameEventMap[K]): this;
  on(event: string, fn: (...args: any[]) => void): this;

  /** Remove a specific listener or all listeners for an event. */
  off<K extends keyof EpixFrameEventMap>(event: K, fn?: EpixFrameEventMap[K]): this;
  off(event: string, fn?: (...args: any[]) => void): this;

  /** Add a one-time listener. */
  once<K extends keyof EpixFrameEventMap>(event: K, fn: EpixFrameEventMap[K]): this;
  once(event: string, fn: (...args: any[]) => void): this;

  // ---------------------------------------------------------------------------
  // Wrapper convenience methods
  // ---------------------------------------------------------------------------

  serverInfo(): Promise<ServerInfo>;
  siteInfo(): Promise<SiteInfo>;

  /**
   * Read wrapper-side storage. Values stored by 1.0.x (wrapped in a
   * one-element array) are unwrapped.
   */
  getLocalStorage(): Promise<Record<string, any> | null>;
  /** Write wrapper-side storage; `data` is stored as given. */
  setLocalStorage(data: Record<string, any>): Promise<void>;

  getState(): Promise<any>;

  // Fire-and-forget: the wrapper never answers these, so they register no
  // callback and return a Promise that is already resolved once posted.
  pushState(state: any): Promise<void>;
  replaceState(state: any): Promise<void>;
  setViewport(viewport: string): Promise<void>;
  setTitle(title: string): Promise<void>;
  notify(type: 'info' | 'done' | 'error', message: string, timeout?: number): Promise<void>;
  openWindow(url: string): Promise<void>;
  innerLoaded(): Promise<void>;

  /**
   * Resolves `true` when the user clicks the button. Dismissing the dialog
   * sends no answer, so the Promise then stays pending.
   */
  confirm(message: string): Promise<boolean>;
  /**
   * @param type input type, default 'text'
   * @param caption button label, default 'OK'
   * @param placeholder input placeholder
   */
  prompt(message: string, type?: string, caption?: string, placeholder?: string): Promise<string>;

  /**
   * Ask the user for a permission. If it is already granted the wrapper
   * sends no answer (the Promise stays pending): check
   * siteInfo().settings.permissions first.
   */
  requestPermission(permission: string): Promise<any>;

  // ---------------------------------------------------------------------------
  // File operations
  // ---------------------------------------------------------------------------

  fileGet(path: string, opts?: FileGetOptions): Promise<string | null>;
  fileWrite(path: string, content: string): Promise<string>;
  fileDelete(path: string): Promise<string>;
  fileList(path: string): Promise<string[]>;
  fileRules(path: string): Promise<FileRules>;
  fileNeed(path: string, opts?: FileNeedOptions): Promise<string>;
  dirList(path: string, opts?: { stats?: false }): Promise<string[]>;
  dirList(path: string, opts: { stats: true }): Promise<DirEntry[]>;

  // ---------------------------------------------------------------------------
  // Database
  // ---------------------------------------------------------------------------

  dbQuery(query: string, params?: Record<string, any>): Promise<any[]>;

  // ---------------------------------------------------------------------------
  // Site management
  // ---------------------------------------------------------------------------

  siteSign(privatekey?: string, innerPath?: string, opts?: Record<string, any>): Promise<string>;
  sitePublish(privatekey?: string, innerPath?: string, opts?: Record<string, any>): Promise<string>;

  // ---------------------------------------------------------------------------
  // Identity (xID)
  // ---------------------------------------------------------------------------

  certSelect(): Promise<string>;
  xidResolve(address: string): Promise<any>;
  xidResolveName(name: string): Promise<any>;
  xidResolveBatch(addresses: string[]): Promise<Record<string, any>>;
  xidResolveIdentity(address: string): Promise<any>;
  /**
   * @deprecated Not implemented by the EpixNet node: always rejects. Use
   * `siteInfo().canonical_domain` for the current xite, or `xidResolveName`.
   */
  xidResolveSite(site: string): Promise<never>;

  // ---------------------------------------------------------------------------
  // Encryption / Signing
  // ---------------------------------------------------------------------------

  encrypt(text: string, publickey?: string): Promise<string>;
  decrypt(text: string): Promise<string>;
  sign(text: string): Promise<string>;
  verify(text: string, address: string, signature: string): Promise<boolean>;
  getPublicKey(index?: number): Promise<string>;
  pubToAddr(pubkey: string): Promise<string>;

  // ---------------------------------------------------------------------------
  // Feed / Newsfeed
  // ---------------------------------------------------------------------------

  feedFollow(feeds: Record<string, any>): Promise<string>;
  feedList(): Promise<Record<string, any>>;
  /** Requires the ADMIN permission. */
  feedQuery(params?: FeedQueryParams): Promise<FeedItem[]>;
  /** Requires the ADMIN permission. */
  feedSearch(query: string): Promise<FeedItem[]>;

  // ---------------------------------------------------------------------------
  // Content filtering / Mute
  // ---------------------------------------------------------------------------

  muteAdd(authAddress: string, certUserId: string, reason: string): Promise<string>;
  muteRemove(authAddress: string): Promise<string>;
  /** Requires the ADMIN permission. */
  muteList(): Promise<any[]>;

  // ---------------------------------------------------------------------------
  // Optional files
  // ---------------------------------------------------------------------------

  optionalFilePin(path: string): Promise<string>;
  optionalFileUnpin(path: string): Promise<string>;
  optionalFileDelete(path: string): Promise<string>;
  optionalFileInfo(path: string): Promise<any>;
  /**
   * @param filterInnerPath SQL LIKE pattern on the inner path ('%' wildcard), or null for all
   */
  optionalFileList(filterInnerPath?: string | null, opts?: OptionalFileListOptions): Promise<any[]>;
  optionalFileList(opts: OptionalFileListOptions): Promise<any[]>;
  optionalHelp(directory: string, title: string, address?: string): Promise<string>;
  optionalHelpRemove(directory: string, address?: string): Promise<string>;

  // ---------------------------------------------------------------------------
  // Merger sites
  // ---------------------------------------------------------------------------

  mergerSiteAdd(addresses: string | string[]): Promise<string>;
  mergerSiteDelete(address: string): Promise<string>;
  mergerSiteList(querySiteInfo?: boolean): Promise<Record<string, any>>;

  // ---------------------------------------------------------------------------
  // VRF beacon
  // ---------------------------------------------------------------------------

  vrfGetBeacon(height: number): Promise<VrfBeacon>;
  vrfLatestBeacon(): Promise<VrfBeacon>;
  /**
   * @param beacon the hex `beacon` string of a VrfBeacon
   * @returns `count` hex values, value[i] = sha256(beacon + seed + i)
   */
  vrfDeriveRandom(beacon: string, seed: string, count: number): Promise<VrfDeriveResult>;
  vrfMultiBlockBeacon(endHeight: number, blocks: number): Promise<VrfMultiBlockResult>;
  /** A no-op on the current node (it keeps no beacon cache); resolves 'ok'. */
  vrfInvalidateCache(): Promise<string>;

  // ---------------------------------------------------------------------------
  // Chain RPC URLs
  // ---------------------------------------------------------------------------

  chainRpcUrl(): Promise<string | null>;
  chainEvmRpcUrl(): Promise<string | null>;
  chainBlockExplorerUrl(): Promise<string | null>;

  // ---------------------------------------------------------------------------
  // Ajax monkey-patching
  // ---------------------------------------------------------------------------

  /**
   * Patch XMLHttpRequest and fetch to add the xite's ajax key to requests
   * for this node's own host only (never to other hosts). Same-host requests
   * made before the key arrives wait for it. Idempotent.
   */
  monkeyPatchAjax(): Promise<void>;
}

/**
 * The shared EpixFrame instance (the same object as the UMD
 * `window.epixFrame`), created lazily on first use. Use it directly
 * (`epixFrame.siteInfo()`); calling it (`epixFrame()`, the 1.0.x form)
 * also returns the instance.
 */
export declare const epixFrame: EpixFrame & (() => EpixFrame);
