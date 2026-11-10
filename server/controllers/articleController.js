const mongoose = require('mongoose');
const Article = require('../models/Article');
const { isYouTubeUrl } = require('../utils/youtube');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getArticles = async (req, res) => {
  try {
    const requestedPage = Number.parseInt(req.query.page, 10);
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 24)
      : 9;

    const filter = { status: 'published' };
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const search = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';

    if (category && category.toLowerCase() !== 'home') {
      filter.category = category;
    }

    if (search) {
      const safeSearch = new RegExp(escapeRegex(search), 'i');
      filter.$or = [
        { title: safeSearch },
        { excerpt: safeSearch },
        { content: safeSearch },
        { category: safeSearch },
        { tags: safeSearch },
      ];
    }

    const [articles, total] = await Promise.all([
      Article.find(filter)
        .sort({ isFeatured: -1, homepageOrder: -1, publishedAt: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Article.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: total,
      articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load articles.' });
  }
};

const getBreakingNews = async (req, res) => {
  try {
    const articles = await Article.find({ status: 'published', isBreakingNews: true })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(5)
      .lean();
    res.status(200).json({ success: true, articles });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load breaking news.' });
  }
};

const getArticleBySlug = async (req, res) => {
  try {
    const article = await Article.findOne({
      slug: req.params.slug,
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

const getRelatedArticles = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid article ID.' });
    }
    const currentArticle = await Article.findOne({
      _id: req.params.id,
      status: 'published',
    }).select('_id category');
    if (!currentArticle) {
      return res.status(404).json({ success: false, message: 'Article not found.' });
    }
    const articles = await Article.find({
      status: 'published',
      category: currentArticle.category,
      _id: { $ne: currentArticle._id },
    })
      .sort({ isFeatured: -1, homepageOrder: -1, publishedAt: -1 })
      .limit(3)
      .lean();
    res.status(200).json({ success: true, articles });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load related stories.' });
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
  'featuredImage', 'videoUrl', 'status', 'isFeatured', 'homepageOrder', 'isBreakingNews', 'tags', 'metaTitle', 'metaDescription', 'scheduledAt',
];

const validateArticle = (data) => {
  if (!data.title || !data.excerpt || !data.content || !data.category) {
    return 'Title, excerpt, content and category are required.';
  }
  if (typeof data.title !== 'string' || data.title.trim().length > 180) {
    return 'Headline must be a text value no longer than 180 characters.';
  }
  if (typeof data.excerpt !== 'string' || data.excerpt.trim().length > 320) {
    return 'Summary must be a text value no longer than 320 characters.';
  }
  if (typeof data.content !== 'string' || data.content.length > 100000) {
    return 'Article content must be text and cannot exceed 100,000 characters.';
  }
  if (typeof data.category !== 'string' || data.category.trim().length > 60) {
    return 'Category must be a text value no longer than 60 characters.';
  }
  if (!['draft', 'published'].includes(data.status || 'draft')) {
    return 'Status must be draft or published.';
  }
  if (data.scheduledAt !== undefined && data.scheduledAt !== null && data.scheduledAt !== '') {
    const scheduledDate = new Date(data.scheduledAt);
    if (Number.isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) {
      return 'Scheduled publication time must be a valid future date and time.';
    }
  }
  if (data.metaTitle !== undefined && (typeof data.metaTitle !== 'string' || data.metaTitle.length > 70)) {
    return 'SEO title must be text no longer than 70 characters.';
  }
  if (data.metaDescription !== undefined && (typeof data.metaDescription !== 'string' || data.metaDescription.length > 180)) {
    return 'SEO description must be text no longer than 180 characters.';
  }
  if (data.homepageOrder !== undefined && (!Number.isInteger(data.homepageOrder) || data.homepageOrder < 0 || data.homepageOrder > 999)) {
    return 'Homepage priority must be a whole number between 0 and 999.';
  }
  if (data.isBreakingNews !== undefined && typeof data.isBreakingNews !== 'boolean') {
    return 'Breaking-news selection must be true or false.';
  }
  if (data.tags !== undefined && (!Array.isArray(data.tags) || data.tags.some((tag) => typeof tag !== 'string'))) {
    return 'Tags must be an array of strings.';
  }
  if (data.featuredImage && !isHttpUrl(data.featuredImage)) {
    return 'Featured image must be a valid HTTP or HTTPS URL.';
  }
  if (data.videoUrl && !isYouTubeUrl(data.videoUrl)) {
    return 'Video URL must be a valid YouTube video link.';
  }
  return null;
};

const isHttpUrl = (value) => {
  if (typeof value !== 'string') return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
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
    if (payload.scheduledAt) {
      payload.scheduledAt = new Date(payload.scheduledAt);
      payload.status = 'draft';
      payload.publishedAt = null;
    } else if (payload.status === 'published') {
      payload.scheduledAt = null;
      payload.publishedAt = new Date();
    } else {
      payload.scheduledAt = null;
      payload.publishedAt = null;
    }
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

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ success: false, message: 'No article changes were provided.' });
    }

    if (payload.scheduledAt !== undefined && payload.scheduledAt !== null && payload.scheduledAt !== '') {
      const scheduledDate = new Date(payload.scheduledAt);
      if (Number.isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) {
        return res.status(400).json({ success: false, message: 'Scheduled publication time must be a valid future date and time.' });
      }
      payload.scheduledAt = scheduledDate;
      payload.status = 'draft';
      payload.publishedAt = null;
    } else if (payload.scheduledAt === null || payload.scheduledAt === '') {
      payload.scheduledAt = null;
    }
    if (payload.metaTitle !== undefined && (typeof payload.metaTitle !== 'string' || payload.metaTitle.length > 70)) {
      return res.status(400).json({ success: false, message: 'SEO title must be text no longer than 70 characters.' });
    }
    if (payload.metaDescription !== undefined && (typeof payload.metaDescription !== 'string' || payload.metaDescription.length > 180)) {
      return res.status(400).json({ success: false, message: 'SEO description must be text no longer than 180 characters.' });
    }
    if (payload.homepageOrder !== undefined && (!Number.isInteger(payload.homepageOrder) || payload.homepageOrder < 0 || payload.homepageOrder > 999)) {
      return res.status(400).json({ success: false, message: 'Homepage priority must be a whole number between 0 and 999.' });
    }
    if (payload.isBreakingNews !== undefined && typeof payload.isBreakingNews !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Breaking-news selection must be true or false.' });
    }
    if (payload.status && !['draft', 'published'].includes(payload.status)) {
      return res.status(400).json({ success: false, message: 'Status must be draft or published.' });
    }
    if (payload.featuredImage && !isHttpUrl(payload.featuredImage)) {
      return res.status(400).json({ success: false, message: 'Featured image must be a valid HTTP or HTTPS URL.' });
    }
    if (payload.videoUrl && !isYouTubeUrl(payload.videoUrl)) {
      return res.status(400).json({ success: false, message: 'Video URL must be a valid YouTube video link.' });
    }
    if (payload.status === 'published') {
      payload.scheduledAt = null;
      const existing = await Article.findById(req.params.id).select('publishedAt status');
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Article not found.' });
      }
      if (existing.status !== 'published' || !existing.publishedAt) {
        payload.publishedAt = new Date();
      }
    }
    if (payload.status === 'draft') {
      payload.publishedAt = null;
      if (payload.scheduledAt === undefined) payload.scheduledAt = null;
    }

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
  getBreakingNews,
  getArticleBySlug,
  getRelatedArticles,
  getArticleById,
  getAdminArticles,
  createArticle,
  updateArticle,
  deleteArticle,
};
