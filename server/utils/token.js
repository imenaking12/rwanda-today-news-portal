const crypto = require('crypto');

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set to a random value of at least 32 characters.');
  }
  return secret;
};

const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');

const createToken = (admin) => {
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const payload = encode({
    sub: admin._id.toString(),
    role: admin.role,
    iat: now,
    exp: now + 60 * 60 * 8,
  });
  const unsigned = header + '.' + payload;
  const signature = crypto.createHmac('sha256', getSecret()).update(unsigned).digest('base64url');
  return unsigned + '.' + signature;
};

const verifyToken = (token) => {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');

  const unsigned = parts[0] + '.' + parts[1];
  const expected = crypto.createHmac('sha256', getSecret()).update(unsigned).digest();
  const received = Buffer.from(parts[2], 'base64url');

  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    throw new Error('Invalid token signature');
  }

  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  if (!payload.sub || !payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired or invalid');
  }
  return payload;
};

module.exports = { createToken, verifyToken };
