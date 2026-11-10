const test = require('node:test');
const assert = require('node:assert/strict');
const Article = require('../models/Article');
const Category = require('../models/Category');
const { createResearchDraft } = require('../controllers/editorialAiController');

const invoke = async (body = {}) => {
  const result = { statusCode: 200, body: null };
  const res = {
    status(code) { result.statusCode = code; return this; },
    json(payload) { result.body = payload; return this; },
  };
  await createResearchDraft({ body, admin: { _id: 'admin-test-id' } }, res);
  return result;
};

const withEnvironment = async (values, run) => {
  const keys = ['OPENAI_API_KEY', 'OPENAI_MODEL'];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  for (const key of keys) {
    if (values[key] === undefined) delete process.env[key];
    else process.env[key] = values[key];
  }
  try { await run(); } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
};

test('creates a private editorial draft using web research citations', async () => {
  const originalFind = Category.find;
  const originalCreate = Article.create;
  const originalFetch = global.fetch;
  const draft = {
    title: 'Kigali transport project update',
    excerpt: 'Officials have announced a new update on a city transport project.',
    content: 'Officials published an update.\n\nThe announcement outlines the next steps.',
    category: 'Rwanda',
    tags: ['Kigali', 'Transport'],
  };
  let saved;
  let requestBody;
  Category.find = () => ({
    select: () => ({
      lean: async () => [{ name: 'Rwanda' }, { name: 'Business' }],
    }),
  });
  Article.create = async (payload) => {
    saved = payload;
    return {
      ...payload,
      _id: { toString: () => 'ai-draft-id' },
      createdAt: new Date('2026-11-10T00:00:00.000Z'),
    };
  };
  global.fetch = async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    requestBody = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({
        output: [{
          type: 'message',
          content: [{
            type: 'output_text',
            text: JSON.stringify(draft),
            annotations: [{
              type: 'url_citation',
              url_citation: { title: 'Official transport announcement', url: 'https://example.gov.rw/transport' },
            }],
          }],
        }],
      }),
    };
  };

  try {
    await withEnvironment({ OPENAI_API_KEY: 'test-private-key', OPENAI_MODEL: 'gpt-6-luna' }, async () => {
      const result = await invoke({ topic: 'Research the latest Kigali transport project update.' });
      assert.equal(result.statusCode, 201);
      assert.equal(saved.status, 'draft');
      assert.equal(saved.publishedAt, null);
      assert.equal(saved.homepageOrder, 0);
      assert.equal(saved.category, 'Rwanda');
      assert.equal(saved.sources[0].url, 'https://example.gov.rw/transport');
      assert.equal(result.body.article.status, 'draft');
      assert.equal(requestBody.tools[0].type, 'web_search');
      assert.equal(requestBody.store, false);
      assert.equal(requestBody.text.format.type, 'json_schema');
    });
  } finally {
    Category.find = originalFind;
    Article.create = originalCreate;
    global.fetch = originalFetch;
  }
});

test('does not call the AI provider when the API key is missing', async () => {
  await withEnvironment({}, async () => {
    const result = await invoke({ topic: 'Research a news story.' });
    assert.equal(result.statusCode, 503);
  });
});

test('refuses to save a draft when web-search citations are missing', async () => {
  const originalFind = Category.find;
  const originalCreate = Article.create;
  const originalFetch = global.fetch;
  let createCalled = false;
  Category.find = () => ({
    select: () => ({
      lean: async () => [{ name: 'Rwanda' }],
    }),
  });
  Article.create = async () => { createCalled = true; throw new Error('Should not save'); };
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      output: [{
        type: 'message',
        content: [{
          type: 'output_text',
          text: JSON.stringify({
            title: 'Unsupported story',
            excerpt: 'Summary',
            content: 'Article content',
            category: 'Rwanda',
            tags: [],
          }),
          annotations: [],
        }],
      }],
    }),
  });

  try {
    await withEnvironment({ OPENAI_API_KEY: 'test-private-key' }, async () => {
      const result = await invoke({ topic: 'Research a story with sources.' });
      assert.equal(result.statusCode, 502);
      assert.equal(createCalled, false);
    });
  } finally {
    Category.find = originalFind;
    Article.create = originalCreate;
    global.fetch = originalFetch;
  }
});
