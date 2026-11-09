import { useEffect, useMemo, useState } from 'react';
import './App.css';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import { apiRequest, clearAdminToken, getStoredToken } from './services/api';

const categories = ['Home', 'Rwanda', 'Politics', 'Business', 'Sports', 'Entertainment', 'Technology', 'World', 'Opinion'];

const formatDate = (value) => {
  if (!value) return 'Latest';
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
};

function ArticleCard({ article, onOpen, featured = false }) {
  return (
    <button className={featured ? 'story-card featured-card' : 'story-card'} onClick={() => onOpen(article)}>
      {article.featuredImage ? <img src={article.featuredImage} alt="" /> : <div className="image-placeholder"><span>RWANDA TODAY</span></div>}
      <div className="story-card-body">
        <span className="category-label">{article.category}</span>
        <h2>{article.title}</h2>
        <p>{article.excerpt}</p>
        <span className="story-meta">{article.author || 'Rwanda Today'} · {formatDate(article.publishedAt || article.createdAt)}</span>
      </div>
    </button>
  );
}

function PublicSite() {
  const [articles, setArticles] = useState([]);
  const [category, setCategory] = useState('Home');
  const [search, setSearch] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    apiRequest('/articles')
      .then((data) => setArticles(data.articles || []))
      .catch((error) => setApiError(error.message || 'The news service is temporarily unavailable.'))
      .finally(() => setLoading(false));
  }, []);

  const visibleArticles = useMemo(() => {
    const term = search.trim().toLowerCase();
    return articles.filter((article) => {
      const matchesCategory = category === 'Home' || article.category?.toLowerCase() === category.toLowerCase();
      const matchesSearch = !term || [article.title, article.excerpt, article.content, article.category, ...(article.tags || [])]
        .join(' ').toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [articles, category, search]);

  const featured = visibleArticles.find((article) => article.isFeatured) || visibleArticles[0];
  const remaining = visibleArticles.filter((article) => article._id !== featured?._id);

  if (selectedArticle) {
    return (
      <div className="site-shell">
        <header className="site-header"><a className="masthead" href="/" onClick={(e) => { e.preventDefault(); setSelectedArticle(null); }}>RWANDA <span>TODAY</span></a><p className="masthead-tagline">THE STORIES THAT MATTER</p></header>
        <main className="article-detail">
          <button className="back-link" onClick={() => setSelectedArticle(null)}>← Back to headlines</button>
          <span className="category-label">{selectedArticle.category}</span>
          <h1>{selectedArticle.title}</h1>
          <p className="article-deck">{selectedArticle.excerpt}</p>
          <p className="story-meta">By {selectedArticle.author || 'Rwanda Today'} · {formatDate(selectedArticle.publishedAt)}</p>
          {selectedArticle.featuredImage && <img className="article-hero-image" src={selectedArticle.featuredImage} alt="" />}
          {selectedArticle.videoUrl && <a className="video-link" href={selectedArticle.videoUrl} target="_blank" rel="noreferrer">Watch related video on YouTube ↗</a>}
          <div className="article-content">{selectedArticle.content.split('\n').filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
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
          {categories.map((item) => <button className={category === item ? 'active' : ''} key={item} onClick={() => setCategory(item)}>{item}</button>)}
        </nav>
      </header>

      <div className="breaking-strip"><strong>RWANDA TODAY</strong><span>Independent reporting from Rwanda and around the world.</span></div>

      <main className="home-content">
        <div className="section-title"><div><span className="eyebrow">YOUR DAILY BRIEFING</span><h1>{category === 'Home' ? 'Top stories' : category}</h1></div><label className="search-box"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search the news" /></label></div>

        {apiError && <div className="notice"><strong>News service unavailable.</strong> Start the Rwanda Today backend to load published stories. <span>{apiError}</span></div>}
        {loading ? <div className="loading-state">Loading the latest headlines…</div> : visibleArticles.length === 0 ? (
          <div className="empty-news"><span className="eyebrow">THE NEWSROOM</span><h2>{search ? 'No matching stories found' : 'Your next headline starts here.'}</h2><p>{search ? 'Try another search term or choose a different category.' : 'Published articles from the editorial dashboard will appear here.'}</p></div>
        ) : (
          <>
            {featured && <section className="lead-story-section"><ArticleCard article={featured} onOpen={setSelectedArticle} featured /></section>}
            {remaining.length > 0 && <section className="latest-section"><div className="section-title compact"><div><span className="eyebrow">FRESH FROM THE NEWSROOM</span><h2>Latest stories</h2></div><span className="article-count">{visibleArticles.length} stories</span></div><div className="news-grid">{remaining.map((article) => <ArticleCard key={article._id} article={article} onOpen={setSelectedArticle} />)}</div></section>}
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
    if (!getStoredToken()) {
      setCheckingSession(false);
      return;
    }
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

  return <PublicSite />;
}
