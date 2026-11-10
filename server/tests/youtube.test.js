const test = require('node:test');
const assert = require('node:assert/strict');
const { getYouTubeVideoId, isYouTubeUrl } = require('../utils/youtube');

test('accepts standard YouTube watch URLs', () => {
  assert.equal(getYouTubeVideoId('https://www.youtube.com/watch?v=abcdefghijk'), 'abcdefghijk');
});

test('accepts shortened YouTube URLs', () => {
  assert.equal(getYouTubeVideoId('https://youtu.be/abcdefghijk?t=30'), 'abcdefghijk');
});

test('accepts YouTube Shorts URLs', () => {
  assert.equal(getYouTubeVideoId('https://www.youtube.com/shorts/abcdefghijk'), 'abcdefghijk');
});

test('accepts privacy-enhanced embed URLs', () => {
  assert.equal(getYouTubeVideoId('https://www.youtube-nocookie.com/embed/abcdefghijk'), 'abcdefghijk');
});

test('rejects unrelated hosts and malformed video IDs', () => {
  assert.equal(getYouTubeVideoId('https://example.com/watch?v=abcdefghijk'), null);
  assert.equal(getYouTubeVideoId('https://www.youtube.com/watch?v=too-short'), null);
  assert.equal(isYouTubeUrl('not a URL'), false);
});

test('rejects non-web protocols', () => {
  assert.equal(getYouTubeVideoId('javascript:alert(1)'), null);
  assert.equal(getYouTubeVideoId('file:///etc/passwd'), null);
});
