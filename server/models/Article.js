const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    excerpt: { type: String, required: true, trim: true, maxlength: 320 },
    content: { type: String, required: true, maxlength: 100000 },
    category: { type: String, required: true, trim: true, maxlength: 60 },
    author: { type: String, default: 'Rwanda Today', trim: true, maxlength: 100 },
    featuredImage: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
      index: true,
    },
    isFeatured: { type: Boolean, default: false },
    tags: {
      type: [{ type: String, trim: true, maxlength: 40 }],
      default: [],
    },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

articleSchema.index({ status: 1, isFeatured: -1, publishedAt: -1, createdAt: -1 });
articleSchema.index({ status: 1, category: 1, publishedAt: -1 });

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;
