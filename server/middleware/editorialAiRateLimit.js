const requests = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 5;

const editorialAiRateLimit = (req, res, next) => {
  const now = Date.now();
  const key = req.admin?._id?.toString() || 'unknown-admin';
  const current = requests.get(key);

  if (!current || current.resetAt <= now) {
    requests.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  if (current.count >= MAX_REQUESTS) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    res.setHeader('Retry-After', String(retryAfter));
    return res.status(429).json({
      success: false,
      message: 'The newsroom AI draft limit has been reached. Please wait before requesting more research.',
    });
  }

  current.count += 1;
  return next();
};

module.exports = { editorialAiRateLimit };
