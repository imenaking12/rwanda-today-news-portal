const test = require('node:test');
const assert = require('node:assert/strict');
const Article = require('../models/Article');
const { getBreakingNews } = require('../controllers/articleController');

test('returns only the breaking-news feed requested from the database', async () => {
  const originalFind = Article.find;
  const stories = [{ _id: 'story-1', title: 'Breaking headline' }];
  let capturedFilter;
  let capturedLimit;
  Article.find = (filter) => {
    capturedFilter = filter;
    return {
      sort() {
        return {
          limit(value) {
            capturedLimit = value;
            return { lean: async () => stories };
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
    await getBreakingNews({}, res);
    assert.deepEqual(capturedFilter, { status: 'published', isBreakingNews: true });
    assert.equal(capturedLimit, 5);
    assert.deepEqual(result.body.articles, stories);
    assert.equal(result.statusCode, 200);
  } finally {
    Article.find = originalFind;
  }
});
