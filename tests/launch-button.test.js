// Run: node --test tests/launch-button.test.js
const test = require('node:test');
const assert = require('node:assert');
globalThis.MW_CONFIG = { apiBase: 'https://api.example.test' };
const L = require('../assets/launch-button.js');

test('everything is coming soon until the server says ready', () => {
  assert.ok(L.lights(null).every((l) => l.state === 'coming_soon' && l.tone === 'off'));
  const c = L.canLaunch({ signedIn: true, status: { state: 'coming_soon' }, jobId: 'j', caption: 'hi', platforms: ['youtube'] });
  assert.equal(c.ok, false);
  assert.match(c.why, /Coming soon/);
});

test('lights follow the server states', () => {
  const st = { state: 'ready', platforms: [{ platform: 'youtube', state: 'connected' }, { platform: 'instagram', state: 'not_connected' }] };
  const by = Object.fromEntries(L.lights(st).map((l) => [l.id, l]));
  assert.equal(by.youtube.tone, 'on');
  assert.equal(by.instagram.tone, 'warn');
  assert.equal(by.tiktok.state, 'coming_soon');
});

test('only connected AND switched-on feeds are sent', () => {
  const st = { state: 'ready', platforms: [{ platform: 'youtube', state: 'connected' }, { platform: 'instagram', state: 'connected' }, { platform: 'tiktok', state: 'coming_soon' }] };
  const socials = { yt: { on: true }, ig: { on: false }, tt: { on: true } };  // Publish desk ids
  assert.deepEqual(L.pickPlatforms(st, socials), ['youtube']);
});

test('canLaunch checks each requirement', () => {
  const base = { signedIn: true, status: { state: 'ready' }, jobId: 'j', caption: 'hi', platforms: ['youtube'] };
  assert.equal(L.canLaunch(base).ok, true);
  assert.equal(L.canLaunch({ ...base, signedIn: false }).ok, false);
  assert.equal(L.canLaunch({ ...base, jobId: '' }).ok, false);
  assert.equal(L.canLaunch({ ...base, caption: '  ' }).ok, false);
  assert.equal(L.canLaunch({ ...base, caption: 'x'.repeat(2201) }).ok, false);
  assert.equal(L.canLaunch({ ...base, platforms: [] }).ok, false);
});

test('API calls carry the sign-in token, never a vendor key, and surface server messages', async () => {
  globalThis.MW_ID_TOKEN = 'tok123';
  let seen;
  const f = async (url, o) => { seen = { url, o }; return { ok: false, status: 429, json: async () => ({ error: 'daily_cap', message: 'Limit reached.' }) }; };
  await assert.rejects(L.publish({ job_id: 'j' }, f), (e) => e.status === 429 && e.message === 'Limit reached.');
  assert.equal(seen.url, 'https://api.example.test/v2/publish');
  assert.equal(seen.o.headers.Authorization, 'Bearer tok123');
  assert.equal(seen.o.credentials, 'omit');
  globalThis.MW_ID_TOKEN = '';
  await assert.rejects(L.status(f), (e) => e.status === 0);
});

test('idempotency keys are unique hex', () => {
  const a = L.newKey(), b = L.newKey();
  assert.match(a, /^[0-9a-f]{24}$/);
  assert.notEqual(a, b);
});
