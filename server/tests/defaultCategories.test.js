const test = require('node:test');
const assert = require('node:assert/strict');
const Category = require('../models/Category');
const { DEFAULT_CATEGORIES, ensureDefaultCategories } = require('../services/defaultCategories');

test('seeds default categories with insert-only values', async () => {
  const originalUpdateOne = Category.updateOne;
  const calls = [];
  Category.updateOne = async (...args) => { calls.push(args); return { upsertedCount: 1 }; };
  try {
    await ensureDefaultCategories();
    assert.equal(calls.length, DEFAULT_CATEGORIES.length);
    assert.equal(calls[0][0].slug, 'rwanda');
    assert.equal(calls[0][1].$setOnInsert.name, 'Rwanda');
    assert.equal(calls[0][2].upsert, true);
  } finally {
    Category.updateOne = originalUpdateOne;
  }
});
