'use strict';

// The ESM `epixFrame` export and the UMD `window.epixFrame` both behave as
// the shared, lazily created EpixFrame instance.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { load } = require('./harness.cjs');

const ESM = pathToFileURL(path.join(__dirname, '..', 'dist', 'epixframe.esm.js')).href;

test('ESM epixFrame is usable as the singleton object and as a getter', async () => {
  const mod = await import(ESM);
  assert.equal(typeof mod.epixFrame.siteInfo, 'function');
  assert.equal(typeof mod.epixFrame.cmd, 'function');
  const instance = mod.epixFrame();
  assert.ok(instance instanceof mod.EpixFrame);
  assert.equal(mod.epixFrame(), instance, 'always the same instance');
  assert.ok(mod.epixFrame instanceof mod.EpixFrame);
  assert.equal(mod.epixFrame.isEmbedded, false);
  mod.epixFrame.custom = 42;
  assert.equal(instance.custom, 42);
  assert.ok('siteInfo' in mod.epixFrame);
  assert.equal('_singleton' in mod, false);
});

test('UMD window.epixFrame is the same instance as the module singleton', () => {
  const h = load();
  const viaWindow = h.ctx.epixFrame;
  assert.ok(viaWindow instanceof h.ctx.EpixFrame);
  assert.equal(h.ctx.EpixFrameModule.epixFrame(), viaWindow);
  assert.equal(h.ctx.epixFrame, viaWindow);
});

test('loading the UMD build creates no frame until window.epixFrame is used', () => {
  const h = load();
  assert.equal(h.sent.length, 0, 'no innerReady before first use');
  void h.ctx.epixFrame;
  assert.equal(h.sent[0].cmd, 'innerReady');
});
