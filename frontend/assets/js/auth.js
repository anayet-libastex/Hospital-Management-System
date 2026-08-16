// auth.js
import { apiFetch } from './api.js';

export async function loginUser(email, password) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function registerPatient(name, email, password, phone, dateOfBirth, bloodGroup) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, phone, dateOfBirth, bloodGroup }),
  });
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

export function getCurrentUser() {
  return JSON.parse(localStorage.getItem('user') || 'null');
}

export function isAuthenticated() {
  return !!localStorage.getItem('token');
}