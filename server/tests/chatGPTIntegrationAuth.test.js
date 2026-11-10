const test = require('node:test');
const assert = require('node:assert/strict');
const { requireChatGPTIntegration } = require('../middleware/chatGPTIntegrationAuth');

const invoke = (authorization) => {
  const req = { get: () => authorization || '' };
  const result = { statusCode: 200, body: null, nextCalled: false };
  const res = {
    status(code) { result.statusCode = code; return this; },
    json(body) { result.body = body; return this; },
  };
  requireChatGPTIntegration(req, res, () => { result.nextCalled = true; });
  return result;
};

test('rejects requests when the integration token is not configured', () => {
  const previous = process.env.CHATGPT_INTEGRATION_TOKEN;
  delete process.env.CHATGPT_INTEGRATION_TOKEN;
  const result = invoke('Bearer ' + 'a'.repeat(48));
  assert.equal(result.statusCode, 401);
  assert.equal(result.nextCalled, false);
  if (previous !== undefined) process.env.CHATGPT_INTEGRATION_TOKEN = previous;
});

test('rejects a missing or incorrect bearer token', () => {
  process.env.CHATGPT_INTEGRATION_TOKEN = 'expected-secret-token-value-that-is-long-enough';
  assert.equal(invoke('').statusCode, 401);
  assert.equal(invoke('Bearer ' + 'x'.repeat(48)).statusCode, 401);
});

test('accepts the configured bearer token', () => {
  const token = 'private-chatgpt-action-token-with-more-than-32-chars';
  process.env.CHATGPT_INTEGRATION_TOKEN = token;
  const result = invoke('Bearer ' + token);
  assert.equal(result.statusCode, 200);
  assert.equal(result.nextCalled, true);
});
