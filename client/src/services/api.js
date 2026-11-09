const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const getStoredToken = () => sessionStorage.getItem('rwandaTodayAdminToken');

export const apiRequest = async (path, options = {}) => {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getStoredToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
};

export const saveAdminToken = (token) => sessionStorage.setItem('rwandaTodayAdminToken', token);
export const clearAdminToken = () => sessionStorage.removeItem('rwandaTodayAdminToken');
