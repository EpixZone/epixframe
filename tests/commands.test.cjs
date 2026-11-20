'use strict';

// The parameter shapes the helpers put on the wire must match what the
// EpixNet wrapper (ui/media/all.js) and node (crates/epix-ui/src/command.rs)
// read.

const test = require('node:test');
const assert = require('node:assert/strict');
const { load, flush } = require('./harness.cjs');

function pendingCount(frame) {
  return Object.keys(frame.waiting_cb).length;
}

test('setLocalStorage sends the data object itself', async () => {
  const h = load();
  const frame = h.frame();
  const done = frame.setLocalStorage({ theme: 'dark', n: 2 });
  assert.deepEqual(h.lastSent('wrapperSetLocalStorage').params, { theme: 'dark', n: 2 });
  h.respond('wrapperSetLocalStorage', null);
  await done;
});

test('getLocalStorage unwraps the legacy one-element array shape', async () => {
  const h = load();
  const frame = h.frame();

  let p = frame.getLocalStorage();
  h.respond('wrapperGetLocalStorage', [{ theme: 'dark' }]);
  assert.deepEqual(await p, { theme: 'dark' });

  p = frame.getLocalStorage();
  h.respond('wrapperGetLocalStorage', { theme: 'light' });
  assert.deepEqual(await p, { theme: 'light' });

  p = frame.getLocalStorage();
  h.respond('wrapperGetLocalStorage', null);
  assert.equal(await p, null);
});

test('requestPermission sends the permission as a string', () => {
  const h = load();
  h.frame().requestPermission('Merger:EpixPost');
  assert.equal(h.lastSent('wrapperPermissionAdd').params, 'Merger:EpixPost');
});

test('prompt maps message, type, caption, placeholder to the wrapper slots', () => {
  const h = load();
  const frame = h.frame();
  frame.prompt('Name?', 'text', 'Save', 'your name');
  assert.deepEqual(h.lastSent('wrapperPrompt').params, ['Name?', 'text', 'Save', 'your name']);

  frame.prompt('Password?', 'password');
  assert.deepEqual(h.lastSent('wrapperPrompt').params, ['Password?', 'password', '', '']);

  frame.prompt('Plain?');
  assert.deepEqual(h.lastSent('wrapperPrompt').params, ['Plain?', 'text', '', '']);
});

test('confirm resolves true when the user clicks the button', async () => {
  const h = load();
  const p = h.frame().confirm('Delete?');
  assert.deepEqual(h.lastSent('wrapperConfirm').params, ['Delete?']);
  h.respond('wrapperConfirm', 1);
  assert.equal(await p, true);
});

test('dirList and optionalFileList send named parameters', () => {
  const h = load();
  const frame = h.frame();

  frame.dirList('data/users', { stats: true });
  assert.deepEqual(h.lastSent('dirList').params, { inner_path: 'data/users', stats: true });

  frame.dirList('data');
  assert.deepEqual(h.lastSent('dirList').params, { inner_path: 'data' });

  frame.optionalFileList('data/videos/%', { filter: 'downloaded,bigfile', limit: 10, orderby: 'size DESC' });
  assert.deepEqual(h.lastSent('optionalFileList').params, {
    filter_inner_path: 'data/videos/%',
    filter: 'downloaded,bigfile',
    limit: 10,
    orderby: 'size DESC',
  });

  frame.optionalFileList({ address: 'epix1other', limit: 5 });
  assert.deepEqual(h.lastSent('optionalFileList').params, { address: 'epix1other', limit: 5 });

  frame.optionalFileList();
  assert.deepEqual(h.lastSent('optionalFileList').params, {});
});

test('vrfDeriveRandom sends [beacon, seed, count]', () => {
  const h = load();
  h.frame().vrfDeriveRandom('ab'.repeat(32), 'lottery-7', 3);
  assert.deepEqual(h.lastSent('vrfDeriveRandom').params, ['ab'.repeat(32), 'lottery-7', 3]);
});

test('fire-and-forget helpers register no pending callback and resolve', async () => {
  const h = load();
  const frame = h.frame();
  const before = pendingCount(frame);
  const results = [
    frame.notify('info', 'hello', 3000),
    frame.setTitle('Title'),
    frame.setViewport('width=device-width'),
    frame.pushState({ page: 2 }),
    frame.replaceState({ page: 3 }),
    frame.openWindow('https://example.org/'),
    frame.innerLoaded(),
  ];
  assert.equal(pendingCount(frame), before, 'no entry left in the pending-callback map');
  for (const r of results) {
    assert.equal(typeof r.then, 'function');
  }
  await Promise.all(results);

  assert.deepEqual(h.lastSent('wrapperNotification').params, ['info', 'hello', 3000]);
  assert.equal(h.lastSent('wrapperSetTitle').params, 'Title');
  assert.equal(h.lastSent('wrapperSetViewport').params, 'width=device-width');
  assert.deepEqual(h.lastSent('wrapperPushState').params, [{ page: 2 }, null]);
  assert.deepEqual(h.lastSent('wrapperReplaceState').params, [{ page: 3 }, null]);
  assert.deepEqual(h.lastSent('wrapperOpenWindow').params, ['https://example.org/']);
  assert.ok(h.lastSent('wrapperInnerLoaded'));
  // Each still carries an id: the wrapper keys notifications by it.
  assert.equal(typeof h.lastSent('wrapperNotification').id, 'number');
});

test('xidResolveSite warns and rejects without sending anything', async () => {
  const h = load();
  const frame = h.frame();
  const count = h.sent.length;
  await assert.rejects(frame.xidResolveSite('epix1xite'), (err) => {
    assert.match(err.error, /not implemented/);
    return true;
  });
  assert.equal(h.sent.length, count);
  assert.ok(h.warnings.some((w) => /xidResolveSite/.test(w)));
});

test('on() events fire even when a subclass overrides the hooks without super', async () => {
  const h = load();
  const Base = h.ctx.EpixFrame;
  const hookCalls = [];
  class App extends Base {
    onOpenWebsocket() { hookCalls.push('open'); }
    onCloseWebsocket() { hookCalls.push('close'); }
    onRequest(cmd) { hookCalls.push('request:' + cmd); }
  }
  const app = new App();
  const events = [];
  app.on('openWebsocket', () => events.push('open'));
  app.on('closeWebsocket', () => events.push('close'));
  app.on('request', (cmd) => events.push('request:' + cmd));

  h.deliver({ cmd: 'wrapperOpenedWebsocket' });
  h.deliver({ cmd: 'setSiteInfo', params: {} });
  h.deliver({ cmd: 'wrapperClosedWebsocket' });
  await flush();

  // The singleton was never touched, so `app` is the only frame listening.
  assert.deepEqual(hookCalls, ['open', 'request:setSiteInfo', 'close']);
  assert.deepEqual(events, ['open', 'request:setSiteInfo', 'close']);
});

test('the default hooks emit each event exactly once', () => {
  const h = load();
  const frame = h.frame();
  let opened = 0;
  frame.on('openWebsocket', () => opened++);
  h.deliver({ cmd: 'wrapperOpenedWebsocket' });
  assert.equal(opened, 1);
});

test('the beforeunload scroll save registers no pending callback', () => {
  const h = load();
  const frame = h.frame();
  const before = pendingCount(frame);
  h.listeners.beforeunload.forEach((fn) => fn());
  assert.equal(pendingCount(frame), before);
  assert.ok(h.lastSent('wrapperReplaceState'));
});
