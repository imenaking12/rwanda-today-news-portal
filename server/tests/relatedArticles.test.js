const test = require('node:test');
const assert = require('node:assert/strict');
const Article = require('../models/Article');
const { getRelatedArticles } = require('../controllers/articleController');

test('returns up to three published stories from the current article category', async () => {
  const originalFindOne = Article.findOne;
  const originalFind = Article.find;
  const current = { _id: 'article-1', category: 'Rwanda' };
  const related = [{ _id: 'article-2', title: 'Related story' }];
  let relatedFilter;
  let limit;
  Article.findOne = () => ({ select: async () => current });
  Article.find = (filter) => {
    relatedFilter = filter;
    return {
      sort() {
        return {
          limit(value) {
            limit = value;
            return { lean: async () => related };
          },
        };
      },
    };
  };

  const result = { statusCode: 200, body: null };
  const res = {
    status(code) { result.statusCode = code; return this; },
    json(body) { result.body = body; return this; },
  };

  try {
    await getRelatedArticles({ params: { id: '507f1f77bcf86cd799439011' } }, res);
    assert.equal(relatedFilter.status, 'published');
    assert.equal(relatedFilter.category, 'Rwanda');
    assert.equal(relatedFilter._id.$ne, current._id);
    assert.equal(limit, 3);
    assert.deepEqual(result.body.articles, related);
    assert.equal(result.statusCode, 200);
  } finally {
    Article.findOne = originalFindOne;
    Article.find = originalFind;
  }
});
