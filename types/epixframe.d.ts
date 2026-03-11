/**
 * EpixFrame  - Unified communication library for EpixNet sites.
 *
 * @license MIT
 * @version 1.0.0
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

export interface VrfBeacon {
  height: number;
  randomness: string;
  proof: string;
  prover: string;
  timestamp: string;
  [key: string]: any;
}

export interface VrfDeriveResult {
  values: string[];
  source_beacon: VrfBeacon;
  [key: string]: any;
}

export interface VrfMultiBlockResult {
  combined_randomness: string;
  beacons: VrfBeacon[];
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

  /** Called when the wrapper websocket opens. */
  onOpenWebsocket(): void;

  /** Called when the wrapper websocket closes. */
  onCloseWebsocket(): void;

  /** Called for unhandled wrapper commands. */
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

  /** Log with [EpixFrame] prefix. */
  log(...args: any[]): void;

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

  getLocalStorage(): Promise<Record<string, any>>;
  setLocalStorage(data: Record<string, any>): Promise<string>;

  getState(): Promise<any>;
  pushState(state: any): Promise<void>;
  replaceState(state: any): Promise<void>;

  setViewport(viewport: string): Promise<void>;
  setTitle(title: string): Promise<void>;

  notify(type: 'info' | 'done' | 'error', message: string, timeout?: number): Promise<void>;
  confirm(message: string): Promise<boolean>;
  prompt(message: string, type?: string, placeholder?: string): Promise<string | null>;

  openWindow(url: string): Promise<void>;
  innerLoaded(): Promise<void>;
  requestPermission(permission: string): Promise<string>;

  // ---------------------------------------------------------------------------
  // File operations
  // ---------------------------------------------------------------------------

  fileGet(path: string, opts?: FileGetOptions): Promise<string | null>;
  fileWrite(path: string, content: string): Promise<string>;
  fileDelete(path: string): Promise<string>;
  fileList(path: string): Promise<string[]>;
  fileRules(path: string): Promise<FileRules>;
  fileNeed(path: string, opts?: FileNeedOptions): Promise<string>;
  dirList(path: string, opts?: any): Promise<string[]>;

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
  xidResolveSite(site: string): Promise<any>;

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
  feedQuery(params?: FeedQueryParams): Promise<FeedItem[]>;
  feedSearch(query: string): Promise<FeedItem[]>;

  // ---------------------------------------------------------------------------
  // Content filtering / Mute
  // ---------------------------------------------------------------------------

  muteAdd(authAddress: string, certUserId: string, reason: string): Promise<string>;
  muteRemove(authAddress: string): Promise<string>;
  muteList(): Promise<any[]>;

  // ---------------------------------------------------------------------------
  // Optional files
  // ---------------------------------------------------------------------------

  optionalFilePin(path: string): Promise<string>;
  optionalFileUnpin(path: string): Promise<string>;
  optionalFileDelete(path: string): Promise<string>;
  optionalFileInfo(path: string): Promise<any>;
  optionalFileList(path: string): Promise<any[]>;
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
  vrfDeriveRandom(height: number, seed: string, count: number): Promise<VrfDeriveResult>;
  vrfMultiBlockBeacon(endHeight: number, blocks: number): Promise<VrfMultiBlockResult>;
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

  /** Patch XMLHttpRequest and fetch to include the ajax key. */
  monkeyPatchAjax(): Promise<void>;
}

/**
 * Lazy singleton  - returns the shared EpixFrame instance.
 * Created on first call.
 */
export declare function epixFrame(): EpixFrame;

/** The singleton instance (available after first call to epixFrame()). */
export declare const _singleton: EpixFrame | null;
