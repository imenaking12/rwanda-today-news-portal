import { useEffect, useState } from 'react';
import { apiRequest, clearAdminToken } from '../services/api';

const toLocalDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const emptyForm = {
  title: '', excerpt: '', content: '', category: 'Rwanda', author: 'Rwanda Today',
  featuredImage: '', videoUrl: '', status: 'draft', isFeatured: false, isBreakingNews: false, metaTitle: '', metaDescription: '', scheduledAt: '', tags: '',
};

export default function AdminDashboard({ admin, onLogout }) {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

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

  useEffect(() => {
    let active = true;
    apiRequest('/categories/admin/all')
      .then((data) => {
        if (active) setCategories(data.categories || []);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const createCategory = async (event) => {
    event.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;
    try {
      await apiRequest('/categories', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      setNewCategoryName('');
      setMessage('Category created.');
      const data = await apiRequest('/categories/admin/all');
      setCategories(data.categories || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleCategory = async (category) => {
    try {
      await apiRequest(`/categories/${category._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !category.isActive }),
      });
      const data = await apiRequest('/categories/admin/all');
      setCategories(data.categories || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Choose a JPG, PNG, WEBP or GIF image.');
      event.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Images must be 10 MB or smaller.');
      event.target.value = '';
      return;
    }

    setUploadingImage(true);
    setError('');
    setMessage('');
    try {
      const config = await apiRequest('/media/signature', { method: 'POST' });
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('api_key', config.apiKey);
      uploadData.append('timestamp', String(config.timestamp));
      uploadData.append('signature', config.signature);
      uploadData.append('upload_preset', config.uploadPreset);
      uploadData.append('folder', config.folder);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
        method: 'POST',
        body: uploadData,
      });
      const result = await response.json();
      if (!response.ok || !result.secure_url) {
        throw new Error(result.error?.message || 'Cloudinary could not upload this image.');
      }
      setForm((current) => ({ ...current, featuredImage: result.secure_url }));
      setMessage('Image uploaded. Its secure URL has been added to this article.');
    } catch (err) {
      setError(err.message || 'Image upload failed.');
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

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
      metaTitle: article.metaTitle || '',
      metaDescription: article.metaDescription || '',
      scheduledAt: toLocalDateTime(article.scheduledAt),
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
      scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
      status: form.scheduledAt ? 'draft' : form.status,
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
            <label>Category<select name="category" value={form.category} onChange={updateField}>{[...new Set([form.category, ...categories.filter((item) => item.isActive).map((item) => item.name)])].map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Author<input name="author" value={form.author} onChange={updateField} /></label>
            <label className="full-field">Upload featured image<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={uploadImage} disabled={uploadingImage} />{uploadingImage ? 'Uploading image…' : 'JPG, PNG, WEBP or GIF · maximum 10 MB'}</label>
            <label className="full-field">Featured image URL<input type="url" name="featuredImage" value={form.featuredImage} onChange={updateField} placeholder="https://…" /></label>
            <label className="full-field">YouTube video URL (optional)<input type="url" name="videoUrl" value={form.videoUrl} onChange={updateField} placeholder="https://www.youtube.com/watch?v=…" /></label>
            <label>SEO title (optional)<input name="metaTitle" value={form.metaTitle} onChange={updateField} maxLength="70" placeholder="Search result title" /></label>
            <label>SEO description (optional)<textarea name="metaDescription" value={form.metaDescription} onChange={updateField} maxLength="180" rows="2" placeholder="Short description for search engines" /></label>
            <label>Tags (comma separated)<input name="tags" value={form.tags} onChange={updateField} placeholder="Kigali, Rwanda, News" /></label>
            <label>Publishing status<select name="status" value={form.scheduledAt ? 'draft' : form.status} onChange={updateField} disabled={Boolean(form.scheduledAt)}><option value="draft">Save as draft</option><option value="published">Publish now</option></select></label>
            <label className="full-field">Schedule publication (optional)<input type="datetime-local" name="scheduledAt" value={form.scheduledAt} min={toLocalDateTime(new Date())} onChange={updateField} /></label>
            <p className="muted full-field">A scheduled story stays private as a draft until its selected time. The backend must be running to publish it automatically.</p>
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

        <section className="category-manager-panel">
          <div className="panel-heading"><h2>Manage news categories</h2></div>
          <form className="category-create-form" onSubmit={createCategory}>
            <input value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} placeholder="New category name" maxLength="50" aria-label="New category name" />
            <button className="primary-button" type="submit">Add category</button>
          </form>
          <div className="category-manager-list">
            {categories.map((item) => <div className="category-manager-row" key={item._id}>
              <span>{item.name}</span><span className={item.isActive ? 'category-active' : 'category-inactive'}>{item.isActive ? 'Active' : 'Hidden'}</span>
              <button type="button" className="text-button" onClick={() => toggleCategory(item)}>{item.isActive ? 'Deactivate' : 'Activate'}</button>
            </div>)}
          </div>
        </section>

        <section className="article-list-panel">
          <div className="panel-heading"><h2>All articles</h2><button className="text-button" onClick={loadArticles}>Refresh list</button></div>
          {loading ? <p className="muted">Loading articles…</p> : articles.length === 0 ? <p className="empty-state">No articles yet. Write your first story above.</p> : (
            <div className="admin-article-list">
              {articles.map((article) => (
                <article className="admin-article-row" key={article._id}>
                  <div><span className={`status-pill ${article.status}`}>{article.status}</span>{article.isBreakingNews && <span className="breaking-admin-badge">BREAKING</span>}<h3>{article.title}</h3><p>{article.category} · {article.author || 'Rwanda Today'}</p>{article.scheduledAt && article.status === 'draft' && <p className="scheduled-label">Scheduled for {new Date(article.scheduledAt).toLocaleString()}</p>}{article.sources?.length > 0 && <p className="source-list">Research sources: {article.sources.map((source, index) => <a key={source.url + index} href={source.url} target="_blank" rel="noreferrer">{source.title}</a>)}</p>}</div>
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
