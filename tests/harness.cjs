'use strict';

// Loads dist/epixframe.js (the UMD build xites vendor) into a fresh vm
// context that stands in for the sandboxed inner frame: a fake window with
// location, document, parent.postMessage, addEventListener, fetch and
// XMLHttpRequest. Every message the library posts to the wrapper is recorded
// in `sent`, and `respond()` plays the wrapper's answer back.

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// EPIXFRAME_BUILD=epixframe.min.js runs the same tests against the
// minified build.
const BUILD = process.env.EPIXFRAME_BUILD || 'epixframe.js';
const UMD = fs.readFileSync(path.join(__dirname, '..', 'dist', BUILD), 'utf8');

const DEFAULT_HREF = 'http://127.0.0.1:42222/epix1xite/index.html?wrapper_nonce=abc123';

function load(opts) {
  opts = opts || {};
  const href = new URL(opts.href || DEFAULT_HREF);
  const sent = [];
  const fetchCalls = [];
  const xhrs = [];
  const warnings = [];
  const listeners = {};

  const location = {
    href: href.href,
    host: href.host,
    hostname: href.hostname,
    port: href.port,
    protocol: href.protocol,
    origin: href.origin,
    pathname: href.pathname,
    search: href.search,
    hash: href.hash,
  };

  class FakeXHR {
    constructor() {
      this.calls = [];
      xhrs.push(this);
    }
    open() { this.calls.push(['open'].concat(Array.from(arguments))); }
    setRequestHeader() { this.calls.push(['setRequestHeader'].concat(Array.from(arguments))); }
    send() { this.calls.push(['send'].concat(Array.from(arguments))); }
    abort() { this.calls.push(['abort']); }
  }

  const win = {
    console: {
      log() {},
      warn() { warnings.push(Array.from(arguments).join(' ')); },
      error() {},
    },
    URL: URL,
    Request: Request,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    location: location,
    document: { location: location, documentElement: { scrollTop: 0 } },
    pageXOffset: 0,
    pageYOffset: 0,
    scroll() {},
    parent: {
      postMessage(message) { sent.push(structuredClone(message)); },
    },
    addEventListener(type, fn) {
      (listeners[type] = listeners[type] || []).push(fn);
    },
    fetch() {
      fetchCalls.push(Array.from(arguments));
      return Promise.resolve({ ok: true });
    },
    XMLHttpRequest: FakeXHR,
  };
  win.window = win;
  const ctx = vm.createContext(win);
  vm.runInContext(UMD, ctx, { filename: 'dist/' + BUILD });

  function deliver(data) {
    (listeners.message || []).forEach(function (fn) { fn({ data: data }); });
  }

  function lastSent(cmd) {
    for (let i = sent.length - 1; i >= 0; i--) {
      if (sent[i].cmd === cmd) return sent[i];
    }
    return undefined;
  }

  // Answer the most recent `cmd` the library sent, as the wrapper would.
  function respond(cmd, result) {
    const message = lastSent(cmd);
    if (!message) throw new Error('nothing sent for ' + cmd);
    deliver({ cmd: 'response', to: message.id, result: result });
  }

  return {
    ctx: ctx,
    sent: sent,
    fetchCalls: fetchCalls,
    xhrs: xhrs,
    warnings: warnings,
    listeners: listeners,
    deliver: deliver,
    respond: respond,
    lastSent: lastSent,
    frame: function () { return ctx.epixFrame; },
  };
}

// Let pending promise callbacks (in any realm) run.
function flush() {
  return new Promise(function (resolve) { setImmediate(resolve); });
}

module.exports = { load: load, flush: flush, DEFAULT_HREF: DEFAULT_HREF };
