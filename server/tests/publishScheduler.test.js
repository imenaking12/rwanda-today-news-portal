const test = require('node:test');
const assert = require('node:assert/strict');
const Article = require('../models/Article');
const { publishDueArticles } = require('../services/publishScheduler');

test('publishes due drafts and clears their schedule date', async () => {
  const originalUpdateMany = Article.updateMany;
  const now = new Date('2026-12-01T10:00:00.000Z');
  let filter;
  let update;
  Article.updateMany = async (query, changes) => {
    filter = query;
    update = changes;
    return { modifiedCount: 2 };
  };

  try {
    const count = await publishDueArticles(now);
    assert.equal(count, 2);
    assert.deepEqual(filter, {
      status: 'draft',
      scheduledAt: { $lte: now, $ne: null },
    });
    assert.deepEqual(update, {
      $set: { status: 'published', publishedAt: now, scheduledAt: null },
    });
  } finally {
    Article.updateMany = originalUpdateMany;
  }
});

test('returns zero when no scheduled drafts are due', async () => {
  const originalUpdateMany = Article.updateMany;
  Article.updateMany = async () => ({ modifiedCount: 0 });
  try {
    assert.equal(await publishDueArticles(new Date()), 0);
  } finally {
    Article.updateMany = originalUpdateMany;
  }
});
