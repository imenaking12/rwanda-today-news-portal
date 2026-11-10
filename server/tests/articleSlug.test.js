const test = require('node:test');
const assert = require('node:assert/strict');
const Article = require('../models/Article');
const { slugify } = require('../utils/slug');

test('converts article headlines into clean readable slugs', () => {
  assert.equal(slugify("  Rwanda's Economy: A New Chapter!  "), 'rwandas-economy-a-new-chapter');
  assert.equal(slugify('Café Kigali — Business News'), 'cafe-kigali-business-news');
});

test('generates a unique slug and default SEO metadata for a new article', async () => {
  const article = new Article({
    title: 'Rwanda launches a new development programme',
    excerpt: 'A summary about a new programme.',
    content: 'The full article text.',
    category: 'Rwanda',
  });
  await article.validate();
  assert.match(article.slug, /^rwanda-launches-a-new-development-programme-[a-f0-9]{6}$/);
  assert.equal(article.metaTitle, article.title);
  assert.equal(article.metaDescription, article.excerpt);
});
