// Thin wrapper around the YouTube Data API v3 (called directly from the browser with an API key).
const YouTube = (() => {
  const API_BASE = 'https://www.googleapis.com/youtube/v3';
  let apiKey = null;
  let chatPollTimer = null;
  let likePollTimer = null;
  let stopped = false;

  function init(key) {
    apiKey = key;
    stopped = false;
  }

  function stop() {
    stopped = true;
    if (chatPollTimer) clearTimeout(chatPollTimer);
    if (likePollTimer) clearInterval(likePollTimer);
  }

  // Accepts a full YouTube URL or a bare video ID and returns the video ID.
  function extractVideoId(input) {
    if (!input) return null;
    const trimmed = input.trim();
    const patterns = [
      /(?:v=|\/live\/|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/,
    ];
    for (const p of patterns) {
      const m = trimmed.match(p);
      if (m) return m[1];
    }
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    return null;
  }

  async function apiGet(path, params) {
    const url = new URL(`${API_BASE}/${path}`);
    url.searchParams.set('key', apiKey);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url.toString());
    const data = await res.json();
    if (!res.ok) {
      const message = data?.error?.message || `YouTube API error (${res.status})`;
      throw new Error(message);
    }
    return data;
  }

  // Looks up the active live chat ID and current statistics for a video.
  async function getVideoInfo(videoId) {
    const data = await apiGet('videos', {
      part: 'liveStreamingDetails,statistics,snippet',
      id: videoId,
    });
    const video = data.items && data.items[0];
    if (!video) throw new Error('Video not found. Check the video ID / URL.');
    const liveChatId = video.liveStreamingDetails?.activeLiveChatId || null;
    const likeCount = video.statistics?.likeCount != null ? parseInt(video.statistics.likeCount, 10) : null;
    return { liveChatId, likeCount, title: video.snippet?.title || '' };
  }

  // Polls live chat messages, invoking onMessages(messages) for each new batch.
  async function pollChat(liveChatId, onMessages, onError, pageToken) {
    if (stopped) return;
    try {
      const data = await apiGet('liveChat/messages', {
        liveChatId,
        part: 'snippet,authorDetails',
        pageToken: pageToken || '',
      });
      if (data.items && data.items.length) onMessages(data.items);
      const interval = Math.max(data.pollingIntervalMillis || 5000, 3000);
      chatPollTimer = setTimeout(() => pollChat(liveChatId, onMessages, onError, data.nextPageToken), interval);
    } catch (err) {
      onError(err);
      // Back off and retry rather than hard-stopping on a transient error.
      chatPollTimer = setTimeout(() => pollChat(liveChatId, onMessages, onError, pageToken), 8000);
    }
  }

  // Polls the video's public like count every `intervalMs` and reports the count via onLikeCount.
  function pollLikes(videoId, onLikeCount, onError, intervalMs) {
    const check = async () => {
      if (stopped) return;
      try {
        const data = await apiGet('videos', { part: 'statistics', id: videoId });
        const item = data.items && data.items[0];
        const likeCount = item?.statistics?.likeCount != null ? parseInt(item.statistics.likeCount, 10) : null;
        if (likeCount != null) onLikeCount(likeCount);
      } catch (err) {
        onError(err);
      }
    };
    check();
    likePollTimer = setInterval(check, intervalMs || 15000);
  }

  return { init, stop, extractVideoId, getVideoInfo, pollChat, pollLikes };
})();

// Also usable from Node (server.js) via require('./js/youtube.js'); no-op in the browser.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = YouTube;
}
