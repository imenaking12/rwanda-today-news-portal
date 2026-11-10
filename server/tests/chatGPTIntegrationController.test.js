const test = require('node:test');
const assert = require('node:assert/strict');
const Article = require('../models/Article');
const Category = require('../models/Category');
const { createDraftFromChatGPT } = require('../controllers/chatGPTIntegrationController');

const invoke = async (body) => {
  const result = { statusCode: 200, body: null };
  const res = {
    status(code) { result.statusCode = code; return this; },
    json(payload) { result.body = payload; return this; },
  };
  await createDraftFromChatGPT({ body }, res);
  return result;
};

test('creates an unpublished draft using an active custom newsroom category', async () => {
  const originalFindOne = Category.findOne;
  const originalCreate = Article.create;
  let lookup;
  let saved;
  Category.findOne = (query) => {
    lookup = query;
    return { select: async () => ({ name: 'Community' }) };
  };
  Article.create = async (payload) => {
    saved = payload;
    return {
      ...payload,
      _id: { toString: () => 'draft-id-123' },
      createdAt: new Date('2026-11-10T00:00:00.000Z'),
    };
  };

  try {
    const result = await invoke({
      title: 'Community update',
      excerpt: 'A short community update.',
      content: 'Verified reporting text.',
      category: 'Community',
      sources: [{ title: 'Official source', url: 'https://example.org/report' }],
    });
    assert.equal(lookup.name, 'Community');
    assert.equal(lookup.isActive, true);
    assert.equal(result.statusCode, 201);
    assert.equal(saved.category, 'Community');
    assert.equal(saved.status, 'draft');
    assert.equal(saved.publishedAt, null);
    assert.equal(result.body.article.status, 'draft');
  } finally {
    Category.findOne = originalFindOne;
    Article.create = originalCreate;
  }
});

test('rejects categories that are not active in the newsroom', async () => {
  const originalFindOne = Category.findOne;
  const originalCreate = Article.create;
  let createCalled = false;
  Category.findOne = () => ({ select: async () => null });
  Article.create = async () => { createCalled = true; throw new Error('Should not create'); };

  try {
    const result = await invoke({
      title: 'Community update',
      excerpt: 'A short community update.',
      content: 'Verified reporting text.',
      category: 'Archived category',
    });
    assert.equal(result.statusCode, 400);
    assert.equal(createCalled, false);
  } finally {
    Category.findOne = originalFindOne;
    Article.create = originalCreate;
  }
});
