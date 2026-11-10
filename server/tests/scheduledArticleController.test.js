const test = require('node:test');
const assert = require('node:assert/strict');
const Article = require('../models/Article');
const { createArticle } = require('../controllers/articleController');

const baseArticle = {
  title: 'Scheduled article test',
  excerpt: 'A short summary for a scheduled story.',
  content: 'The story content.',
  category: 'Rwanda',
};

const invoke = async (body) => {
  const result = { statusCode: 200, body: null };
  const res = {
    status(code) { result.statusCode = code; return this; },
    json(payload) { result.body = payload; return this; },
  };
  await createArticle({ body }, res);
  return result;
};

test('saves a future scheduled article as a private draft', async () => {
  const originalCreate = Article.create;
  let saved;
  Article.create = async (payload) => {
    saved = payload;
    return payload;
  };
  try {
    const scheduledAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const result = await invoke({ ...baseArticle, status: 'published', scheduledAt });
    assert.equal(result.statusCode, 201);
    assert.equal(saved.status, 'draft');
    assert.equal(saved.publishedAt, null);
    assert.ok(saved.scheduledAt instanceof Date);
  } finally {
    Article.create = originalCreate;
  }
});

test('rejects an invalid or past schedule', async () => {
  const invalid = await invoke({ ...baseArticle, scheduledAt: 'not-a-date' });
  assert.equal(invalid.statusCode, 400);
  const past = await invoke({ ...baseArticle, scheduledAt: '2000-01-01T00:00:00.000Z' });
  assert.equal(past.statusCode, 400);
});
