const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

const getYouTubeVideoId = (value) => {
  if (typeof value !== 'string' || !value.trim()) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (!YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) return null;

    let videoId = '';
    if (url.hostname.toLowerCase() === 'youtu.be') {
      videoId = url.pathname.split('/').filter(Boolean)[0] || '';
    } else {
      const parts = url.pathname.split('/').filter(Boolean);
      if (url.pathname === '/watch') {
        videoId = url.searchParams.get('v') || '';
      } else if (['embed', 'shorts', 'live', 'v'].includes(parts[0])) {
        videoId = parts[1] || '';
      }
    }

    return /^[a-zA-Z0-9_-]{11}$/.test(videoId) ? videoId : null;
  } catch {
    return null;
  }
};

const isYouTubeUrl = (value) => Boolean(getYouTubeVideoId(value));

module.exports = { getYouTubeVideoId, isYouTubeUrl };
