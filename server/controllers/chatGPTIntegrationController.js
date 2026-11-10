const Article = require('../models/Article');
const { isYouTubeUrl } = require('../utils/youtube');

const isHttpUrl = (value) => {
  if (typeof value !== 'string') return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const createDraftFromChatGPT = async (req, res) => {
  try {
    const {
      title, excerpt, content, category, author,
      featuredImage, videoUrl, tags,
    } = req.body || {};

    if (![title, excerpt, content, category].every((value) => typeof value === 'string' && value.trim())) {
      return res.status(400).json({
        success: false,
        message: 'title, excerpt, content and category are required text fields.',
      });
    }
    if (title.trim().length > 180 || excerpt.trim().length > 320 || content.length > 100000 || category.trim().length > 60) {
      return res.status(400).json({ success: false, message: 'One or more article fields exceed the allowed length.' });
    }
    const allowedCategories = ['Rwanda', 'Politics', 'Business', 'Sports', 'Entertainment', 'Technology', 'World', 'Opinion'];
    if (!allowedCategories.includes(category.trim())) {
      return res.status(400).json({ success: false, message: 'category must be one of the supported Rwanda Today categories.' });
    }
    if (author !== undefined && (typeof author !== 'string' || author.trim().length > 100)) {
      return res.status(400).json({ success: false, message: 'author must be text no longer than 100 characters.' });
    }
    if (featuredImage && !isHttpUrl(featuredImage)) {
      return res.status(400).json({ success: false, message: 'featuredImage must be a valid HTTP or HTTPS URL.' });
    }
    if (videoUrl && !isYouTubeUrl(videoUrl)) {
      return res.status(400).json({ success: false, message: 'videoUrl must be a valid YouTube video URL.' });
    }
    if (tags !== undefined && (!Array.isArray(tags) || tags.length > 20 || tags.some((tag) => typeof tag !== 'string' || tag.length > 40))) {
      return res.status(400).json({ success: false, message: 'tags must be an array of up to 20 short text values.' });
    }

    const article = await Article.create({
      title: title.trim(),
      excerpt: excerpt.trim(),
      content,
      category: category.trim(),
      author: author?.trim() || 'Rwanda Today',
      featuredImage: featuredImage || '',
      videoUrl: videoUrl || '',
      tags: tags || [],
      status: 'draft',
      isFeatured: false,
      publishedAt: null,
    });

    return res.status(201).json({
      success: true,
      message: 'Draft created in Rwanda Today. An editor must review and publish it.',
      article: {
        id: article._id.toString(),
        title: article.title,
        category: article.category,
        status: article.status,
        createdAt: article.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to create the editorial draft.' });
  }
};

module.exports = { createDraftFromChatGPT };
