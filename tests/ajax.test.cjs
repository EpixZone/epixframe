'use strict';

// monkeyPatchAjax(): the xite's ajax_key goes only to the node's own host,
// and only once the wrapper has handed the key over.

const test = require('node:test');
const assert = require('node:assert/strict');
const { load, flush } = require('./harness.cjs');

const BASE = 'http://127.0.0.1:42222/epix1xite/';

function urlOf(call) {
  const input = call[0];
  return typeof input === 'string' ? input : input.url || input.href;
}

test('fetch waits for the key, then adds it to same-host URLs only', async () => {
  const h = load();
  const frame = h.frame();
  const patched = frame.monkeyPatchAjax();

  // Before the key arrives a same-host request is held back...
  const relative = h.ctx.fetch('data/posts.json');
  assert.equal(h.fetchCalls.length, 0, 'same-host fetch must wait for the key');

  // ...while a third-party request goes straight out, without the key.
  h.ctx.fetch('https://rpc.example.org/status?x=1');
  assert.equal(h.fetchCalls.length, 1);
  assert.equal(urlOf(h.fetchCalls[0]), 'https://rpc.example.org/status?x=1');

  h.respond('wrapperGetAjaxKey', 'KEY123');
  await patched;
  await relative;
  assert.equal(h.fetchCalls.length, 2);
  assert.equal(urlOf(h.fetchCalls[1]), BASE + 'data/posts.json?ajax_key=KEY123');

  // After the key is known: absolute same-host URL, existing query and hash.
  await h.ctx.fetch(BASE + 'data/a.json?limit=5#frag');
  assert.equal(urlOf(h.fetchCalls[2]), BASE + 'data/a.json?limit=5&ajax_key=KEY123#frag');

  // Same hostname on another port is another host: no key.
  await h.ctx.fetch('http://127.0.0.1:8545/');
  assert.equal(urlOf(h.fetchCalls[3]), 'http://127.0.0.1:8545/');

  // A URL that already carries a key is left alone.
  await h.ctx.fetch('data/b.json?ajax_key=OTHER');
  assert.equal(urlOf(h.fetchCalls[4]), 'data/b.json?ajax_key=OTHER');

  // Extra arguments (init) are forwarded unchanged.
  const init = { method: 'POST', body: 'x' };
  await h.ctx.fetch('data/c.json', init);
  assert.equal(urlOf(h.fetchCalls[5]), BASE + 'data/c.json?ajax_key=KEY123');
  assert.equal(h.fetchCalls[5][1], init);
});

test('fetch keys URL objects and Request objects for the same host', async () => {
  const h = load();
  const frame = h.frame();
  const patched = frame.monkeyPatchAjax();
  h.respond('wrapperGetAjaxKey', 'K');
  await patched;

  await h.ctx.fetch(new URL(BASE + 'data/u.json'));
  assert.equal(urlOf(h.fetchCalls[0]), BASE + 'data/u.json?ajax_key=K');

  await h.ctx.fetch(new Request(BASE + 'data/r.json', { method: 'PUT', headers: { 'X-Test': '1' } }));
  const req = h.fetchCalls[1][0];
  assert.ok(req instanceof Request, 'a Request input stays a Request');
  assert.equal(req.url, BASE + 'data/r.json?ajax_key=K');
  assert.equal(req.method, 'PUT');
  assert.equal(req.headers.get('X-Test'), '1');

  await h.ctx.fetch(new Request('https://rpc.example.org/'));
  assert.equal(h.fetchCalls[2][0].url, 'https://rpc.example.org/');
});

test('XHR waits for the key for same-host URLs, never keys other hosts', async () => {
  const h = load();
  const frame = h.frame();
  const patched = frame.monkeyPatchAjax();
  const XHR = h.ctx.XMLHttpRequest;

  const own = new XHR();
  own.open('GET', 'data/posts.json');
  own.setRequestHeader('Accept', 'application/json');
  own.send(null);
  assert.deepEqual(own.calls, [], 'nothing reaches the real XHR before the key');

  const other = new XHR();
  other.open('GET', 'https://rpc.example.org/x', true);
  assert.deepEqual(other.calls, [['open', 'GET', 'https://rpc.example.org/x', true]]);

  h.respond('wrapperGetAjaxKey', 'XK');
  await patched;
  await flush();
  assert.deepEqual(own.calls, [
    ['open', 'GET', BASE + 'data/posts.json?ajax_key=XK'],
    ['setRequestHeader', 'Accept', 'application/json'],
    ['send', null],
  ]);

  // Once the key is known, open() keys synchronously.
  const later = new XHR();
  later.open('POST', '/epix1xite/data/x.json', true);
  assert.deepEqual(later.calls, [['open', 'POST', BASE + 'data/x.json?ajax_key=XK', true]]);
});

test('monkeyPatchAjax is idempotent', async () => {
  const h = load();
  const frame = h.frame();
  const first = frame.monkeyPatchAjax();
  const second = frame.monkeyPatchAjax();
  h.respond('wrapperGetAjaxKey', 'K2');
  await first;
  await second;
  await h.ctx.fetch('data/x.json');
  assert.equal(urlOf(h.fetchCalls[0]), BASE + 'data/x.json?ajax_key=K2');
  assert.equal(h.sent.filter((m) => m.cmd === 'wrapperGetAjaxKey').length, 1);
});
