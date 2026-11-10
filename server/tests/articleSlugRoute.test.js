const test = require('node:test');
const assert = require('node:assert/strict');
const Article = require('../models/Article');
const { getArticleBySlug } = require('../controllers/articleController');

test('loads only a published article by its exact slug', async () => {
  const originalFindOne = Article.findOne;
  const article = { slug: 'rwanda-news-abcdef', status: 'published', title: 'Rwanda news' };
  let filter;
  Article.findOne = async (query) => {
    filter = query;
    return article;
  };

  const result = { statusCode: 200, body: null };
  const res = {
    status(code) { result.statusCode = code; return this; },
    json(body) { result.body = body; return this; },
  };

  try {
    await getArticleBySlug({ params: { slug: article.slug } }, res);
    assert.deepEqual(filter, { slug: article.slug, status: 'published' });
    assert.equal(result.body.article, article);
    assert.equal(result.statusCode, 200);
  } finally {
    Article.findOne = originalFindOne;
  }
});
