const test = require('node:test');
const assert = require('node:assert/strict');
const Article = require('../models/Article');
const Category = require('../models/Category');
const { createDraftFromChatGPT } = require('../controllers/chatGPTIntegrationController');

const validDraft = {
  title: 'Rwanda Today test headline',
  excerpt: 'A short factual summary for an editorial test.',
  content: 'First paragraph.\n\nSecond paragraph.',
  category: 'Rwanda',
  tags: ['Rwanda', 'News'],
  sources: [{ title: 'Official source', url: 'https://example.gov.rw/news' }],
};

const invoke = async (body) => {
  const result = { statusCode: 200, body: null };
  const req = { body };
  const res = {
    status(code) { result.statusCode = code; return this; },
    json(payload) { result.body = payload; return this; },
  };
  await createDraftFromChatGPT(req, res);
  return result;
};

test('creates an unpublished draft and retains its research references', async () => {
  const originalCreate = Article.create;
  const originalFindOne = Category.findOne;
  let saved;
  Category.findOne = () => ({ select: async () => ({ name: 'Rwanda' }) });
  Article.create = async (payload) => {
    saved = payload;
    return {
      ...payload,
      _id: { toString: () => 'draft-test-id' },
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };
  };
  try {
    const result = await invoke(validDraft);
    assert.equal(result.statusCode, 201);
    assert.equal(saved.status, 'draft');
    assert.equal(saved.isFeatured, false);
    assert.equal(saved.publishedAt, null);
    assert.deepEqual(saved.sources, validDraft.sources);
    assert.equal(result.body.article.status, 'draft');
  } finally {
    Article.create = originalCreate;
    Category.findOne = originalFindOne;
  }
});

test('rejects categories that are not active newsroom categories', async () => {
  const originalFindOne = Category.findOne;
  Category.findOne = () => ({ select: async () => null });
  try {
    const result = await invoke({ ...validDraft, category: 'Unsupported' });
    assert.equal(result.statusCode, 400);
  } finally {
    Category.findOne = originalFindOne;
  }
});

test('rejects unsafe or overlong research source URLs', async () => {
  const originalFindOne = Category.findOne;
  Category.findOne = () => ({ select: async () => ({ name: 'Rwanda' }) });
  try {
    const result = await invoke({
      ...validDraft,
      sources: [{ title: 'Untrusted source', url: 'javascript:alert(1)' }],
    });
    assert.equal(result.statusCode, 400);
  } finally {
    Category.findOne = originalFindOne;
  }
});
