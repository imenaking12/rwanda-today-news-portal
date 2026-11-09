
const Article = require('../models/Article');

// Get all published articles
const getArticles = async (req, res) => {
  try {
    const articles = await Article.find({
      status: 'published'
    }).sort({ publishedAt: -1 });

    res.status(200).json({
      success: true,
      count: articles.length,
      articles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get one published article
const getArticleById = async (req, res) => {
  try {
    const article = await Article.findOne({
      _id: req.params.id,
      status: 'published'
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.status(200).json({
      success: true,
      article
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getArticles,
  getArticleById
};
