const crypto = require('crypto');

const requireChatGPTIntegration = (req, res, next) => {
  const configuredToken = process.env.CHATGPT_INTEGRATION_TOKEN || '';
  const authorization = req.get('authorization') || '';
  const suppliedToken = authorization.startsWith('Bearer ')
    ? authorization.slice(7).trim()
    : '';

  if (configuredToken.length < 32 || suppliedToken.length < 32) {
    return res.status(401).json({
      success: false,
      message: 'ChatGPT integration is not configured or the supplied token is invalid.',
    });
  }

  const expected = Buffer.from(configuredToken);
  const received = Buffer.from(suppliedToken);
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
    return res.status(401).json({ success: false, message: 'Invalid integration credentials.' });
  }

  next();
};

module.exports = { requireChatGPTIntegration };
