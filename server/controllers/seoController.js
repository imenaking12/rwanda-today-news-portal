const Article = require('../models/Article');

const escapeXml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const getPublicSiteUrl = () => (process.env.PUBLIC_SITE_URL || process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');

const getSitemap = async (req, res) => {
  try {
    const baseUrl = getPublicSiteUrl();
    const articles = await Article.find({ status: 'published' })
      .select('slug _id updatedAt publishedAt')
      .sort({ updatedAt: -1 })
      .lean();

    const articleUrls = articles.map((article) => {
      const identifier = article.slug || article._id.toString();
      const lastModified = article.updatedAt || article.publishedAt;
      return `<url><loc>${escapeXml(`${baseUrl}/article/${encodeURIComponent(identifier)}`)}</loc>${lastModified ? `<lastmod>${new Date(lastModified).toISOString()}</lastmod>` : ''}</url>`;
    }).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escapeXml(baseUrl)}</loc></url>${articleUrls}</urlset>`;
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.type('application/xml').status(200).send(xml);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to generate sitemap.' });
  }
};

const getRssFeed = async (req, res) => {
  try {
    const baseUrl = getPublicSiteUrl();
    const articles = await Article.find({ status: 'published' })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(30)
      .select('title slug _id excerpt category author publishedAt createdAt')
      .lean();

    const items = articles.map((article) => {
      const identifier = article.slug || article._id.toString();
      const link = `${baseUrl}/article/${encodeURIComponent(identifier)}`;
      const published = article.publishedAt || article.createdAt;
      return `<item><title>${escapeXml(article.title)}</title><link>${escapeXml(link)}</link><guid isPermaLink="true">${escapeXml(link)}</guid><description>${escapeXml(article.excerpt)}</description><category>${escapeXml(article.category)}</category><author>${escapeXml(article.author || 'Rwanda Today')}</author>${published ? `<pubDate>${new Date(published).toUTCString()}</pubDate>` : ''}</item>`;
    }).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Rwanda Today</title><link>${escapeXml(baseUrl)}</link><description>Independent reporting from Rwanda and around the world.</description><language>en-rw</language>${items}</channel></rss>`;
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.type('application/rss+xml').status(200).send(xml);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to generate RSS feed.' });
  }
};

module.exports = { getSitemap, getRssFeed };
