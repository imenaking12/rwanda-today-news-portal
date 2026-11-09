const mongoose = require('mongoose');
const Article = require('../models/Article');

const getArticles = async (req, res) => {
  try {
    const articles = await Article.find({ status: 'published' })
      .sort({ publishedAt: -1, createdAt: -1 });
    res.status(200).json({ success: true, count: articles.length, articles });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load articles.' });
  }
};

const getArticleById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid article ID.' });
    }
    const article = await Article.findOne({
      _id: req.params.id,
      status: 'published',
    });
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found.' });
    }
    res.status(200).json({ success: true, article });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load this article.' });
  }
};

const allowedFields = [
  'title', 'excerpt', 'content', 'category', 'author',
  'featuredImage', 'videoUrl', 'status', 'isFeatured', 'tags',
];

const validateArticle = (data) => {
  if (!data.title || !data.excerpt || !data.content || !data.category) {
    return 'Title, excerpt, content and category are required.';
  }
  if (!['draft', 'published'].includes(data.status || 'draft')) {
    return 'Status must be draft or published.';
  }
  if (data.tags !== undefined && !Array.isArray(data.tags)) {
    return 'Tags must be an array of strings.';
  }
  return null;
};

const createArticle = async (req, res) => {
  try {
    const payload = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) payload[field] = req.body[field];
    }
    const validationError = validateArticle(payload);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }
    if (payload.status === 'published') payload.publishedAt = new Date();
    const article = await Article.create(payload);
    res.status(201).json({ success: true, message: 'Article created.', article });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateArticle = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid article ID.' });
    }
    const payload = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) payload[field] = req.body[field];
    }
    if (payload.status && !['draft', 'published'].includes(payload.status)) {
      return res.status(400).json({ success: false, message: 'Status must be draft or published.' });
    }
    if (payload.status === 'published') payload.publishedAt = new Date();
    if (payload.status === 'draft') payload.publishedAt = null;

    const article = await Article.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found.' });
    }
    res.status(200).json({ success: true, message: 'Article updated.', article });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteArticle = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid article ID.' });
    }
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found.' });
    }
    res.status(200).json({ success: true, message: 'Article deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to delete article.' });
  }
};

const getAdminArticles = async (req, res) => {
  try {
    const articles = await Article.find().sort({ updatedAt: -1 });
    res.status(200).json({ success: true, count: articles.length, articles });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load the admin article list.' });
  }
};

module.exports = {
  getArticles,
  getArticleById,
  getAdminArticles,
  createArticle,
  updateArticle,
  deleteArticle,
};
