const test = require('node:test');
const assert = require('node:assert/strict');
const Article = require('../models/Article');
const { createArticle } = require('../controllers/articleController');

const invoke = async (body) => {
  const result = { statusCode: 200, body: null };
  const res = {
    status(code) { result.statusCode = code; return this; },
    json(payload) { result.body = payload; return this; },
  };
  await createArticle({ body }, res);
  return result;
};

test('accepts a valid homepage priority and stores it with the article', async () => {
  const originalCreate = Article.create;
  let saved;
  Article.create = async (payload) => {
    saved = payload;
    return { ...payload, _id: { toString: () => 'homepage-order-test' } };
  };
  try {
    const result = await invoke({
      title: 'Homepage priority test',
      excerpt: 'A short summary for the test.',
      content: 'Article content.',
      category: 'Rwanda',
      status: 'draft',
      homepageOrder: 25,
    });
    assert.equal(result.statusCode, 201);
    assert.equal(saved.homepageOrder, 25);
  } finally {
    Article.create = originalCreate;
  }
});

test('rejects negative, fractional and excessive homepage priorities', async () => {
  for (const homepageOrder of [-1, 1.5, 1000]) {
    const result = await invoke({
      title: 'Homepage priority test',
      excerpt: 'A short summary for the test.',
      content: 'Article content.',
      category: 'Rwanda',
      homepageOrder,
    });
    assert.equal(result.statusCode, 400);
  }
});
