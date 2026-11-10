const test = require('node:test');
const assert = require('node:assert/strict');
const { loginRateLimit } = require('../middleware/loginRateLimit');

const invoke = (ip) => {
  const req = { ip, socket: { remoteAddress: ip } };
  const result = { statusCode: 200, headers: {}, body: null, nextCalled: false };
  const res = {
    setHeader(name, value) { result.headers[name] = value; },
    status(code) { result.statusCode = code; return this; },
    json(body) { result.body = body; return this; },
  };
  loginRateLimit(req, res, () => { result.nextCalled = true; });
  return result;
};

test('allows the first ten login requests from one address', () => {
  const ip = '192.0.2.41';
  for (let i = 0; i < 10; i += 1) {
    assert.equal(invoke(ip).nextCalled, true);
  }
});

test('blocks further login requests and provides Retry-After', () => {
  const ip = '192.0.2.42';
  for (let i = 0; i < 10; i += 1) invoke(ip);
  const result = invoke(ip);
  assert.equal(result.statusCode, 429);
  assert.ok(Number(result.headers['Retry-After']) > 0);
  assert.equal(result.nextCalled, false);
});

test('tracks different addresses independently', () => {
  const ip = '192.0.2.43';
  for (let i = 0; i < 10; i += 1) invoke(ip);
  assert.equal(invoke('192.0.2.44').nextCalled, true);
});
