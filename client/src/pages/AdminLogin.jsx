import { useState } from 'react';
import { apiRequest, saveAdminToken } from '../services/api';

export default function AdminLogin({ onLogin }) {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ usernameOrEmail, password }),
      });
      saveAdminToken(data.token);
      onLogin(data.admin);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <a className="admin-back-link" href="/">← Back to Rwanda Today</a>
        <p className="eyebrow">SECURE EDITORIAL ACCESS</p>
        <h1>Administrator sign in</h1>
        <p className="muted">Sign in to manage Rwanda Today articles and publishing.</p>
        <label>
          Username or email
          <input autoComplete="username" value={usernameOrEmail} onChange={(e) => setUsernameOrEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </main>
  );
}
