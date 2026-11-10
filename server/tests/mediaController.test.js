const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { getCloudinaryUploadSignature } = require('../controllers/mediaController');

const withCloudinaryEnv = async (values, run) => {
  const keys = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'CLOUDINARY_UPLOAD_PRESET', 'CLOUDINARY_FOLDER'];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  for (const key of keys) {
    if (values[key] === undefined) delete process.env[key];
    else process.env[key] = values[key];
  }
  try { await run(); } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
};

const invoke = () => {
  const result = { statusCode: 200, body: null };
  const res = {
    status(code) { result.statusCode = code; return this; },
    json(body) { result.body = body; return this; },
  };
  getCloudinaryUploadSignature({}, res);
  return result;
};

test('returns a server-generated signature for configured Cloudinary uploads', async () => {
  await withCloudinaryEnv({
    CLOUDINARY_CLOUD_NAME: 'rwanda-test',
    CLOUDINARY_API_KEY: 'public-test-key',
    CLOUDINARY_API_SECRET: 'private-test-secret',
    CLOUDINARY_UPLOAD_PRESET: 'signed-rwanda-preset',
    CLOUDINARY_FOLDER: 'rwanda-today',
  }, async () => {
    const result = invoke();
    assert.equal(result.statusCode, 200);
    const params = {
      folder: result.body.folder,
      timestamp: result.body.timestamp,
      upload_preset: result.body.uploadPreset,
    };
    const base = Object.keys(params).sort().map((key) => `${key}=${params[key]}`).join('&') + 'private-test-secret';
    const expected = crypto.createHash('sha1').update(base).digest('hex');
    assert.equal(result.body.signature, expected);
    assert.equal(result.body.apiKey, 'public-test-key');
  });
});

test('does not issue a signature when Cloudinary credentials are missing', async () => {
  await withCloudinaryEnv({}, async () => {
    const result = invoke();
    assert.equal(result.statusCode, 503);
    assert.equal(result.body.success, false);
  });
});
