const express = require('express');
const { getSitemap, getRssFeed } = require('../controllers/seoController');

const router = express.Router();

router.get('/sitemap.xml', getSitemap);
router.get('/rss.xml', getRssFeed);

module.exports = router;
