// Time-based one-time codes (RFC 6238), compatible with Google Authenticator / Authy.
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function encode(bytes) {
  let bits = 0, val = 0, out = '';
  for (const b of bytes) { val = (val << 8) | b; bits += 8; while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; } }
  if (bits > 0) out += B32[(val << (5 - bits)) & 31];
  return out;
}
function decode(s) {
  const clean = String(s || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  const out = new Uint8Array(Math.floor((clean.length * 5) / 8));
  let bits = 0, val = 0, i = 0;
  for (const c of clean) { val = (val << 5) | B32.indexOf(c); bits += 5; if (bits >= 8) { out[i++] = (val >>> (bits - 8)) & 255; bits -= 8; } }
  return out;
}
async function codeAt(secret, step) {
  const msg = new ArrayBuffer(8);
  new DataView(msg).setUint32(4, step, false);
  const key = await crypto.subtle.importKey('raw', decode(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, msg));
  const o = sig[19] & 0xf;
  const n = (((sig[o] & 0x7f) << 24) | (sig[o + 1] << 16) | (sig[o + 2] << 8) | sig[o + 3]) % 1000000;
  return String(n).padStart(6, '0');
}

export const TOTP = {
  secret() { const a = new Uint8Array(20); crypto.getRandomValues(a); return encode(a); },
  now: codeAt,
  async verify(secret, code) {
    const c = String(code || '').replace(/\s/g, '');
    if (!secret || !/^\d{6}$/.test(c)) return false;
    const step = Math.floor(Date.now() / 30000);
    let ok = false;
    for (const w of [-1, 0, 1]) if ((await codeAt(secret, step + w)) === c) ok = true;
    return ok;
  },
};
