// api.js
const API_BASE = 'http://localhost:5000/api'; // adjust to your backend URL

/**
 * Generic fetch wrapper with token and error handling.
 */
export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.msg || 'Request failed');
  }
  return data;
}

// Optional: export a version that doesn't throw, if needed.
export async function apiFetchSilent(endpoint, options = {}) {
  try {
    return await apiFetch(endpoint, options);
  } catch (err) {
    console.error('API error:', err);
    return null;
  }
}