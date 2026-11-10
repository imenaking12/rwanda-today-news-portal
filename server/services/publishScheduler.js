const Article = require('../models/Article');

const publishDueArticles = async (now = new Date()) => {
  const result = await Article.updateMany(
    { status: 'draft', scheduledAt: { $lte: now, $ne: null } },
    { $set: { status: 'published', publishedAt: now, scheduledAt: null } }
  );
  return result.modifiedCount ?? result.nModified ?? 0;
};

const startPublishScheduler = () => {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      const publishedCount = await publishDueArticles();
      if (publishedCount > 0) {
        console.log(`Scheduled publishing: published ${publishedCount} article(s).`);
      }
    } catch (error) {
      console.error('Scheduled publishing check failed:', error.message);
    } finally {
      running = false;
    }
  };

  run();
  const timer = setInterval(run, 30 * 1000);
  timer.unref?.();
  return timer;
};

module.exports = { publishDueArticles, startPublishScheduler };
