const mongoose = require('mongoose');
const { slugify } = require('../utils/slug');

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    slug: { type: String, unique: true, sparse: true },
    metaTitle: { type: String, trim: true, maxlength: 70 },
    metaDescription: { type: String, trim: true, maxlength: 180 },
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
    isBreakingNews: { type: Boolean, default: false },
    tags: {
      type: [{ type: String, trim: true, maxlength: 40 }],
      default: [],
    },
    sources: {
      type: [{ title: { type: String, trim: true, maxlength: 180 }, url: { type: String, trim: true, maxlength: 2048 } }],
      default: [],
    },
    publishedAt: { type: Date, default: null },
    scheduledAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

articleSchema.pre('validate', function () {
  if (!this.slug && this.title) {
    const base = slugify(this.title) || 'story';
    this.slug = `${base}-${this._id.toString().slice(-6)}`;
  }
  if (!this.metaTitle && this.title) this.metaTitle = this.title.slice(0, 70);
  if (!this.metaDescription && this.excerpt) this.metaDescription = this.excerpt.slice(0, 180);
});

articleSchema.index({ status: 1, isFeatured: -1, publishedAt: -1, createdAt: -1 });
articleSchema.index({ status: 1, category: 1, publishedAt: -1 });

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;
