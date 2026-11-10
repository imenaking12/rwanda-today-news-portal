const test = require('node:test');
const assert = require('node:assert/strict');
const Category = require('../models/Category');
const { createCategory } = require('../controllers/categoryController');

test('creates a normalized category with a generated slug', async () => {
  const originalCount = Category.countDocuments;
  const originalCreate = Category.create;
  let saved;
  Category.countDocuments = async () => 8;
  Category.create = async (payload) => { saved = payload; return payload; };
  const result = { statusCode: 200, body: null };
  const res = {
    status(code) { result.statusCode = code; return this; },
    json(body) { result.body = body; return this; },
  };
  try {
    await createCategory({ body: { name: '  Local Culture  ' } }, res);
    assert.equal(result.statusCode, 201);
    assert.equal(saved.name, 'Local Culture');
    assert.equal(saved.slug, 'local-culture');
    assert.equal(saved.sortOrder, 8);
    assert.equal(saved.isActive, true);
  } finally {
    Category.countDocuments = originalCount;
    Category.create = originalCreate;
  }
});
