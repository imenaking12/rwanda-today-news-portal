const test = require('node:test');
const assert = require('node:assert/strict');
const Article = require('../models/Article');
const { getSitemap, getRssFeed } = require('../controllers/seoController');

const responseMock = () => {
  const result = { statusCode: 200, headers: {}, type: '', body: null };
  const res = {
    setHeader(name, value) { result.headers[name] = value; return this; },
    type(value) { result.type = value; return this; },
    status(value) { result.statusCode = value; return this; },
    send(value) { result.body = value; return this; },
    json(value) { result.body = value; return this; },
  };
  return { result, res };
};

test('sitemap includes the public homepage and published article slugs', async () => {
  const originalFind = Article.find;
  const originalUrl = process.env.PUBLIC_SITE_URL;
  process.env.PUBLIC_SITE_URL = 'https://news.example';
  Article.find = () => ({
    select() {
      return {
        sort() {
          return {
            lean: async () => [{
              _id: 'article-id',
              slug: 'rwanda-story-123abc',
              updatedAt: new Date('2026-01-01T00:00:00.000Z'),
            }],
          };
        },
      };
    },
  });
  const { result, res } = responseMock();
  try {
    await getSitemap({}, res);
    assert.equal(result.statusCode, 200);
    assert.equal(result.type, 'application/xml');
    assert.match(result.body, /https:\/\/news\.example\/article\/rwanda-story-123abc/);
    assert.match(result.body, /<lastmod>2026-01-01T00:00:00.000Z<\/lastmod>/);
  } finally {
    Article.find = originalFind;
    if (originalUrl === undefined) delete process.env.PUBLIC_SITE_URL;
    else process.env.PUBLIC_SITE_URL = originalUrl;
  }
});

test('RSS feed escapes article text and returns the latest published stories', async () => {
  const originalFind = Article.find;
  const originalUrl = process.env.PUBLIC_SITE_URL;
  process.env.PUBLIC_SITE_URL = 'https://news.example';
  Article.find = () => ({
    sort() {
      return {
        limit() {
          return {
            select() {
              return {
                lean: async () => [{
                  _id: 'article-id',
                  slug: 'business-update-123abc',
                  title: 'Business & Trade',
                  excerpt: 'A report about <markets>.',
                  category: 'Business',
                  author: 'Rwanda Today',
                  publishedAt: new Date('2026-01-01T00:00:00.000Z'),
                }],
              };
            },
          };
        },
      };
    },
  });
  const { result, res } = responseMock();
  try {
    await getRssFeed({}, res);
    assert.equal(result.statusCode, 200);
    assert.equal(result.type, 'application/rss+xml');
    assert.match(result.body, /Business &amp; Trade/);
    assert.match(result.body, /A report about &lt;markets&gt;\./);
  } finally {
    Article.find = originalFind;
    if (originalUrl === undefined) delete process.env.PUBLIC_SITE_URL;
    else process.env.PUBLIC_SITE_URL = originalUrl;
  }
});
