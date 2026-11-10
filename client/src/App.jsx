import { useCallback, useEffect, useState } from 'react';
import './App.css';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import { apiRequest, clearAdminToken, getStoredToken } from './services/api';

const defaultCategories = ['Rwanda', 'Politics', 'Business', 'Sports', 'Entertainment', 'Technology', 'World', 'Opinion'];
const PAGE_SIZE = 9;

const readStoredStories = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const storySummary = (article) => ({
  _id: article._id,
  slug: article.slug,
  title: article.title,
  excerpt: article.excerpt,
  category: article.category,
  author: article.author,
  featuredImage: article.featuredImage,
  publishedAt: article.publishedAt,
  createdAt: article.createdAt,
});

const formatDate = (value) => {
  if (!value) return 'Latest';
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
};

function ArticleCard({ article, onOpen, featured = false }) {
  return (
    <button className={featured ? 'story-card featured-card' : 'story-card'} onClick={() => onOpen(article)}>
      {article.featuredImage ? <img src={article.featuredImage} alt="" loading="lazy" /> : <div className="image-placeholder"><span>RWANDA TODAY</span></div>}
      <div className="story-card-body">
        <span className="category-label">{article.category}</span>
        <h2>{article.title}</h2>
        <p>{article.excerpt}</p>
        <span className="story-meta">{article.author || 'Rwanda Today'} · {formatDate(article.publishedAt || article.createdAt)}</span>
      </div>
    </button>
  );
}

const getYouTubeEmbedUrl = (value) => {
  if (!value) return '';
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol)) return '';
    const host = url.hostname.toLowerCase();
    const allowedHosts = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'youtube-nocookie.com', 'www.youtube-nocookie.com'];
    if (!allowedHosts.includes(host)) return '';
    const parts = url.pathname.split('/').filter(Boolean);
    let videoId = '';
    if (host === 'youtu.be') videoId = parts[0] || '';
    else if (url.pathname === '/watch') videoId = url.searchParams.get('v') || '';
    else if (['embed', 'shorts', 'live', 'v'].includes(parts[0])) videoId = parts[1] || '';
    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) return '';
    return 'https://www.youtube-nocookie.com/embed/' + videoId;
  } catch { return ''; }
};

function PublicSite({ path, navigate }) {
  const [articles, setArticles] = useState([]);
  const [categoryList, setCategoryList] = useState(defaultCategories);
  const [breakingNews, setBreakingNews] = useState([]);
  const [category, setCategory] = useState('Home');
  const [search, setSearch] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [shareMessage, setShareMessage] = useState('');
  const [savedStories, setSavedStories] = useState(() => readStoredStories('rwandaTodaySavedStories'));
  const [readingHistory, setReadingHistory] = useState(() => readStoredStories('rwandaTodayReadingHistory'));
  const [savedView, setSavedView] = useState(false);
  const [historyView, setHistoryView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });

  const recordReading = useCallback((article) => {
    const summary = storySummary(article);
    setReadingHistory((current) => [summary, ...current.filter((item) => item._id !== summary._id)].slice(0, 20));
  }, []);

  useEffect(() => {
    try { localStorage.setItem('rwandaTodaySavedStories', JSON.stringify(savedStories)); } catch {}
  }, [savedStories]);

  useEffect(() => {
    try { localStorage.setItem('rwandaTodayReadingHistory', JSON.stringify(readingHistory)); } catch {}
  }, [readingHistory]);

  useEffect(() => {
    const onPopState = () => {
      if (!window.location.pathname.startsWith('/article/')) setSelectedArticle(null);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    let active = true;
    apiRequest('/categories')
      .then((data) => {
        if (active && Array.isArray(data.categories) && data.categories.length) {
          setCategoryList(data.categories.map((item) => item.name));
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (category !== 'Home') params.set('category', category);
    if (search.trim()) params.set('q', search.trim());

    apiRequest(`/articles?${params.toString()}`)
      .then((data) => {
        if (!active) return;
        setArticles(data.articles || []);
        setPagination(data.pagination || { page: 1, total: data.count || 0, totalPages: 1 });
      })
      .catch((error) => {
        if (active) setApiError(error.message || 'The news service is temporarily unavailable.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [category, search, page]);

  useEffect(() => {
    const identifier = path.startsWith('/article/')
      ? decodeURIComponent(path.slice('/article/'.length))
      : '';
    if (!identifier) return undefined;
    if (selectedArticle && (selectedArticle.slug === identifier || selectedArticle._id === identifier)) {
      return undefined;
    }
    let active = true;
    const isObjectId = /^[a-f0-9]{24}$/i.test(identifier);
    apiRequest(isObjectId ? `/articles/${identifier}` : `/articles/slug/${encodeURIComponent(identifier)}`)
      .then((data) => {
        if (active) {
          setSelectedArticle(data.article);
          recordReading(data.article);
        }
      })
      .catch(() => {
        if (active) setSelectedArticle(null);
      });
    return () => { active = false; };
  }, [path, selectedArticle?.slug, selectedArticle?._id, recordReading]);

  useEffect(() => {
    let active = true;
    apiRequest('/articles/breaking')
      .then((data) => {
        if (active) setBreakingNews(data.articles || []);
      })
      .catch(() => {
        if (active) setBreakingNews([]);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedArticle?._id) return undefined;
    let active = true;
    apiRequest(`/articles/${selectedArticle._id}/related`)
      .then((data) => {
        if (active) setRelatedArticles(data.articles || []);
      })
      .catch(() => {
        if (active) setRelatedArticles([]);
      });
    return () => { active = false; };
  }, [selectedArticle?._id]);

  const shareArticle = async () => {
    const url = window.location.href;
    const shareData = { title: selectedArticle.title, text: selectedArticle.excerpt, url };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShareMessage('Story shared.');
      } catch (error) {
        if (error.name !== 'AbortError') setShareMessage('Sharing was not available. You can copy the page URL from your browser.');
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareMessage('Story link copied.');
    } catch {
      setShareMessage('Copy the story URL from your browser address bar.');
    }
  };

  const toggleSavedStory = (article) => {
    const summary = storySummary(article);
    setSavedStories((current) => current.some((item) => item._id === summary._id)
      ? current.filter((item) => item._id !== summary._id)
      : [summary, ...current]);
  };

  const openArticle = (article) => {
    setSelectedArticle(article.content ? article : null);
    recordReading(article);
    setSavedView(false);
    setHistoryView(false);
    setRelatedArticles([]);
    setShareMessage('');
    navigate(`/article/${article.slug || article._id}`);
  };
  const closeArticle = () => {
    setSelectedArticle(null);
    navigate('/');
  };

  useEffect(() => {
    const defaultTitle = 'Rwanda Today | The Stories That Matter';
    document.title = selectedArticle
      ? `${selectedArticle.metaTitle || selectedArticle.title} | Rwanda Today`
      : defaultTitle;
    const description = selectedArticle?.metaDescription || selectedArticle?.excerpt ||
      'Independent reporting, news, context and perspective from Rwanda and around the world.';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', description);
    const openGraphTitle = document.querySelector('meta[property="og:title"]');
    if (openGraphTitle) openGraphTitle.setAttribute('content', selectedArticle?.title || defaultTitle);
    const openGraphDescription = document.querySelector('meta[property="og:description"]');
    if (openGraphDescription) openGraphDescription.setAttribute('content', description);
    const openGraphType = document.querySelector('meta[property="og:type"]');
    if (openGraphType) openGraphType.setAttribute('content', selectedArticle ? 'article' : 'website');
    const openGraphUrl = document.querySelector('meta[property="og:url"]');
    if (openGraphUrl) openGraphUrl.setAttribute('content', window.location.href);
  }, [selectedArticle]);

  const featured = articles.find((article) => article.isFeatured) || articles[0];
  const remaining = articles.filter((article) => article._id !== featured?._id);

  if (selectedArticle) {
    return (
      <div className="site-shell">
        <header className="site-header"><a className="masthead" href="/" onClick={(e) => { e.preventDefault(); closeArticle(); }}>RWANDA <span>TODAY</span></a><p className="masthead-tagline">THE STORIES THAT MATTER</p></header>
        <main className="article-detail">
          <button className="back-link" onClick={closeArticle}>← Back to headlines</button>
          <span className="category-label">{selectedArticle.category}</span>
          <h1>{selectedArticle.title}</h1>
          <p className="article-deck">{selectedArticle.excerpt}</p>
          <p className="story-meta">By {selectedArticle.author || 'Rwanda Today'} · {formatDate(selectedArticle.publishedAt)}</p>
          {selectedArticle.featuredImage && <img className="article-hero-image" src={selectedArticle.featuredImage} alt="" />}
          {getYouTubeEmbedUrl(selectedArticle.videoUrl) && <section className="article-video"><h2>Watch the video</h2><div className="video-frame"><iframe src={getYouTubeEmbedUrl(selectedArticle.videoUrl)} title={'YouTube video: ' + selectedArticle.title} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div></section>}
          <div className="article-content">{selectedArticle.content.split('\n').filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
          {selectedArticle.sources?.length > 0 && <section className="article-sources"><h2>Sources and references</h2><ul>{selectedArticle.sources.map((source, index) => <li key={source.url + index}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul></section>}
          <div className="article-actions"><button type="button" className="outline-button" onClick={() => toggleSavedStory(selectedArticle)}>{savedStories.some((item) => item._id === selectedArticle._id) ? 'Remove saved story' : 'Save for later'}</button><button type="button" className="outline-button" onClick={shareArticle}>Share story</button>{shareMessage && <span role="status">{shareMessage}</span>}</div>
          {relatedArticles.length > 0 && <section className="related-stories"><h2>Related stories</h2><div>{relatedArticles.map((story) => <button type="button" key={story._id} onClick={() => openArticle(story)}>{story.title}<span>{story.category}</span></button>)}</div></section>}
          <div className="article-tags">{(selectedArticle.tags || []).map((tag) => <span key={tag}>#{tag}</span>)}</div>
        </main>
        <footer className="site-footer"><strong>RWANDA <span>TODAY</span></strong><p>Independent reporting. Stories that matter.</p></footer>
      </div>
    );
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="utility-bar"><span>INDEPENDENT NEWS · RWANDA</span><span>NEWS, CONTEXT AND PERSPECTIVE</span></div>
        <a className="masthead" href="/">RWANDA <span>TODAY</span></a>
        <p className="masthead-tagline">THE STORIES THAT MATTER</p>
        <nav className="category-nav" aria-label="News categories">
          {['Home', ...categoryList].map((item) => <button className={!savedView && !historyView && category === item ? 'active' : ''} key={item} onClick={() => { setSavedView(false); setHistoryView(false); setCategory(item); setPage(1); }}>{item}</button>)}
          <button className={savedView ? 'active' : ''} onClick={() => { setSavedView(true); setHistoryView(false); }}>Saved ({savedStories.length})</button>
          <button className={historyView ? 'active' : ''} onClick={() => { setHistoryView(true); setSavedView(false); }}>Reading history</button>
        </nav>
      </header>

      <div className="breaking-strip"><strong>BREAKING NEWS</strong>{breakingNews.length > 0 ? <div className="breaking-headlines">{breakingNews.map((story) => <button key={story._id} onClick={() => openArticle(story)}>{story.title}</button>)}</div> : <span>Independent reporting from Rwanda and around the world.</span>}</div>

      <main className="home-content">
        <div className="section-title">
          <div><span className="eyebrow">{savedView || historyView ? 'YOUR LIBRARY' : 'YOUR DAILY BRIEFING'}</span><h1>{savedView ? 'Saved stories' : historyView ? 'Reading history' : category === 'Home' ? 'Top stories' : category}</h1></div>
          {!savedView && !historyView && <label className="search-box"><span aria-hidden="true">⌕</span><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search the news" aria-label="Search news articles" /></label>}
          {historyView && <button className="text-button" onClick={() => setReadingHistory([])}>Clear history</button>}
        </div>

        {savedView || historyView ? (
          <section className="library-section">
            {(savedView ? savedStories : readingHistory).length > 0
              ? <div className="news-grid">{(savedView ? savedStories : readingHistory).map((article) => <ArticleCard key={article._id} article={article} onOpen={openArticle} />)}</div>
              : <div className="empty-news"><span className="eyebrow">YOUR LIBRARY</span><h2>{savedView ? 'No saved stories yet' : 'No reading history yet'}</h2><p>{savedView ? 'Open a story and choose Save for later to keep it here on this device.' : 'Stories you open will appear here for quick access.'}</p></div>}
          </section>
        ) : (
          <>
            {apiError && <div className="notice"><strong>News service unavailable.</strong> Start the Rwanda Today backend to load published stories. <span>{apiError}</span></div>}
            {loading ? <div className="loading-state" role="status">Loading the latest headlines…</div> : articles.length === 0 ? (
              <div className="empty-news"><span className="eyebrow">THE NEWSROOM</span><h2>{search ? 'No matching stories found' : 'Your next headline starts here.'}</h2><p>{search ? 'Try another search term or choose a different category.' : 'Published articles from the editorial dashboard will appear here.'}</p></div>
            ) : (
              <>
                {featured && <section className="lead-story-section"><ArticleCard article={featured} onOpen={openArticle} featured /></section>}
                {remaining.length > 0 && <section className="latest-section"><div className="section-title compact"><div><span className="eyebrow">FRESH FROM THE NEWSROOM</span><h2>Latest stories</h2></div><span className="article-count">{pagination.total} stories</span></div><div className="news-grid">{remaining.map((article) => <ArticleCard key={article._id} article={article} onOpen={openArticle} />)}</div></section>}
                <nav className="pagination" aria-label="Article pages">
                  <button className="outline-button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || loading}>← Previous</button>
                  <span>Page {pagination.page || page} of {pagination.totalPages || 1}</span>
                  <button className="outline-button" onClick={() => setPage((current) => current + 1)} disabled={page >= pagination.totalPages || loading}>Next →</button>
                </nav>
              </>
            )}
          </>
        )}
      </main>
      <footer className="site-footer"><strong>RWANDA <span>TODAY</span></strong><p>Independent reporting. Stories that matter.</p><a href="/admin/login">Newsroom access</a><small>© {new Date().getFullYear()} Rwanda Today. All rights reserved.</small></footer>
    </div>
  );
}

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [admin, setAdmin] = useState(null);
  const [checkingSession, setCheckingSession] = useState(Boolean(getStoredToken()));

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (!getStoredToken()) return;
    apiRequest('/auth/me')
      .then((data) => setAdmin(data.admin))
      .catch(() => clearAdminToken())
      .finally(() => setCheckingSession(false));
  }, []);

  const navigate = (nextPath) => {
    window.history.pushState({}, '', nextPath);
    setPath(nextPath);
  };

  if (path.startsWith('/admin')) {
    if (checkingSession) return <div className="loading-state full-screen">Checking administrator session…</div>;
    if (path === '/admin/login' && !admin) return <AdminLogin onLogin={(user) => { setAdmin(user); navigate('/admin'); }} />;
    if (!admin) return <AdminLogin onLogin={(user) => { setAdmin(user); navigate('/admin'); }} />;
    return <AdminDashboard admin={admin} onLogout={() => { setAdmin(null); navigate('/admin/login'); }} />;
  }

  return <PublicSite path={path} navigate={navigate} />;
}
