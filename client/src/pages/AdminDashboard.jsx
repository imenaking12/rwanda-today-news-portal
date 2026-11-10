import { useEffect, useState } from 'react';
import { apiRequest, clearAdminToken } from '../services/api';

const emptyForm = {
  title: '', excerpt: '', content: '', category: 'Rwanda', author: 'Rwanda Today',
  featuredImage: '', videoUrl: '', status: 'draft', isFeatured: false, isBreakingNews: false, tags: '',
};

export default function AdminDashboard({ admin, onLogout }) {
  const [articles, setArticles] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  const loadArticles = async () => {
    try {
      const data = await apiRequest('/articles/admin/all');
      setArticles(data.articles || []);
    } catch (err) {
      setError(err.message);
      if (err.message.toLowerCase().includes('session') || err.message.toLowerCase().includes('authentication')) {
        clearAdminToken();
        onLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    apiRequest('/articles/admin/all')
      .then((data) => {
        if (active) setArticles(data.articles || []);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message);
        if (err.message.toLowerCase().includes('session') || err.message.toLowerCase().includes('authentication')) {
          clearAdminToken();
          onLogout();
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [onLogout]);

  const updateField = (event) => {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId('');
  };

  const editArticle = (article) => {
    setEditingId(article._id);
    setForm({
      title: article.title || '',
      excerpt: article.excerpt || '',
      content: article.content || '',
      category: article.category || 'Rwanda',
      author: article.author || 'Rwanda Today',
      featuredImage: article.featuredImage || '',
      videoUrl: article.videoUrl || '',
      status: article.status || 'draft',
      isFeatured: Boolean(article.isFeatured),
      isBreakingNews: Boolean(article.isBreakingNews),
      tags: (article.tags || []).join(', '),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitArticle = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    const payload = {
      ...form,
      tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    };
    try {
      await apiRequest(editingId ? `/articles/${editingId}` : '/articles', {
        method: editingId ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      setMessage(editingId ? 'Article updated successfully.' : 'Article saved successfully.');
      resetForm();
      await loadArticles();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteArticle = async (id) => {
    if (!window.confirm('Delete this article permanently?')) return;
    try {
      await apiRequest(`/articles/${id}`, { method: 'DELETE' });
      setMessage('Article deleted.');
      if (editingId === id) resetForm();
      await loadArticles();
    } catch (err) {
      setError(err.message);
    }
  };

  const logout = () => {
    clearAdminToken();
    onLogout();
  };

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <a className="dashboard-brand" href="/">RWANDA <span>TODAY</span></a>
        <div className="dashboard-user">
          <span>{admin?.username || 'Administrator'}</span>
          <button className="outline-button" onClick={logout}>Sign out</button>
        </div>
      </header>

      <div className="dashboard-container">
        <div className="dashboard-title-row">
          <div><p className="eyebrow">NEWSROOM CONTROL CENTRE</p><h1>Editorial dashboard</h1><p className="muted">Create, edit and publish stories on Rwanda Today.</p></div>
          <div className="dashboard-stat"><strong>{articles.length}</strong><span>Total stories</span></div>
        </div>

        {message && <p className="form-success">{message}</p>}
        {error && <p className="form-error">{error}</p>}

        <section className="editor-panel">
          <div className="panel-heading"><h2>{editingId ? 'Edit article' : 'Write a new article'}</h2><div className="row-actions"><button type="button" className="text-button" onClick={() => setPreviewOpen((open) => !open)}>{previewOpen ? 'Hide preview' : 'Preview draft'}</button>{editingId && <button type="button" className="text-button" onClick={resetForm}>Cancel editing</button>}</div></div>
          <form className="article-form" onSubmit={submitArticle}>
            <label>Headline<input name="title" value={form.title} onChange={updateField} required maxLength="180" /></label>
            <label>Short summary<textarea name="excerpt" value={form.excerpt} onChange={updateField} required rows="2" maxLength="320" /></label>
            <label className="full-field">Article content<textarea name="content" value={form.content} onChange={updateField} required rows="10" /></label>
            <label>Category<select name="category" value={form.category} onChange={updateField}>{['Rwanda', 'Politics', 'Business', 'Sports', 'Entertainment', 'Technology', 'World', 'Opinion'].map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Author<input name="author" value={form.author} onChange={updateField} /></label>
            <label className="full-field">Featured image URL<input type="url" name="featuredImage" value={form.featuredImage} onChange={updateField} placeholder="https://…" /></label>
            <label className="full-field">YouTube video URL (optional)<input type="url" name="videoUrl" value={form.videoUrl} onChange={updateField} placeholder="https://www.youtube.com/watch?v=…" /></label>
            <label>Tags (comma separated)<input name="tags" value={form.tags} onChange={updateField} placeholder="Kigali, Rwanda, News" /></label>
            <label>Publishing status<select name="status" value={form.status} onChange={updateField}><option value="draft">Save as draft</option><option value="published">Publish now</option></select></label>
            <label className="checkbox-label"><input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={updateField} /> Feature on homepage</label>
            <label className="checkbox-label"><input type="checkbox" name="isBreakingNews" checked={form.isBreakingNews} onChange={updateField} /> Show in breaking-news ticker</label>
            <div className="form-actions full-field"><button className="primary-button" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Update article' : 'Save article'}</button></div>
          </form>
          {previewOpen && <section className="draft-preview" aria-label="Article preview">
            <p className="eyebrow">EDITORIAL PREVIEW · NOT PUBLISHED</p>
            <span className="category-label">{form.category || 'Category'}</span>
            <h2>{form.title || 'Your headline will appear here'}</h2>
            <p className="preview-excerpt">{form.excerpt || 'Your short summary will appear here.'}</p>
            {form.featuredImage && <img src={form.featuredImage} alt="Article preview" />}
            <div className="preview-content">{form.content ? form.content.split('\n').filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>) : <p>Your article text will appear here.</p>}</div>
          </section>}
        </section>

        <section className="article-list-panel">
          <div className="panel-heading"><h2>All articles</h2><button className="text-button" onClick={loadArticles}>Refresh list</button></div>
          {loading ? <p className="muted">Loading articles…</p> : articles.length === 0 ? <p className="empty-state">No articles yet. Write your first story above.</p> : (
            <div className="admin-article-list">
              {articles.map((article) => (
                <article className="admin-article-row" key={article._id}>
                  <div><span className={`status-pill ${article.status}`}>{article.status}</span>{article.isBreakingNews && <span className="breaking-admin-badge">BREAKING</span>}<h3>{article.title}</h3><p>{article.category} · {article.author || 'Rwanda Today'}</p>{article.sources?.length > 0 && <p className="source-list">Research sources: {article.sources.map((source, index) => <a key={source.url + index} href={source.url} target="_blank" rel="noreferrer">{source.title}</a>)}</p>}</div>
                  <div className="row-actions"><button className="outline-button" onClick={() => editArticle(article)}>Edit</button><button className="danger-button" onClick={() => deleteArticle(article._id)}>Delete</button></div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
