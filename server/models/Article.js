
const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema(
  {
    // Article headline
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Short description
    excerpt: {
      type: String,
      required: true,
      trim: true,
    },

    // Main article content
    content: {
      type: String,
      required: true,
    },

    // Article category
    category: {
      type: String,
      required: true,
    },

    // Author name
    author: {
      type: String,
      default: 'Rwanda Today',
    },

    // Featured image URL
    featuredImage: {
      type: String,
      default: '',
    },

    // Optional YouTube video URL
    videoUrl: {
      type: String,
      default: '',
    },

    // Article status
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },

    // Featured article on homepage
    isFeatured: {
      type: Boolean,
      default: false,
    },

    // Article tags
    tags: {
      type: [String],
      default: [],
    },

    // Publication date
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;
