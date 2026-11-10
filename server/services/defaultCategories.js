const Category = require('../models/Category');
const { slugify } = require('../utils/slug');

const DEFAULT_CATEGORIES = [
  'Rwanda',
  'Politics',
  'Business',
  'Sports',
  'Entertainment',
  'Technology',
  'World',
  'Opinion',
];

const ensureDefaultCategories = async () => {
  await Promise.all(DEFAULT_CATEGORIES.map((name, sortOrder) => {
    const slug = slugify(name);
    return Category.updateOne(
      { slug },
      { $setOnInsert: { name, slug, sortOrder, isActive: true } },
      { upsert: true }
    );
  }));
};

module.exports = { DEFAULT_CATEGORIES, ensureDefaultCategories };
