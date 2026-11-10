require('dotenv').config();
const mongoose = require('mongoose');
const Article = require('../models/Article');

const backfillArticleSlugs = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI must be configured before running the article SEO migration.');
  }

  await mongoose.connect(process.env.MONGO_URI);
  const articles = await Article.find({
    $or: [{ slug: { $exists: false } }, { slug: null }],
  });

  for (const article of articles) {
    await article.save();
  }

  console.log(`Article SEO migration complete. Updated ${articles.length} article(s).`);
};

backfillArticleSlugs()
  .catch((error) => {
    console.error('Article SEO migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
