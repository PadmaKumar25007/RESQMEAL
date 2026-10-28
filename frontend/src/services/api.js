import { API_BASE_URL } from '../config/env.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const TOKEN_KEY = 'resqmeal_token';

export const getToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (_e) {
    return null;
  }
};

export const setToken = async (token) => {
  if (!token) {
    await AsyncStorage.removeItem(TOKEN_KEY);
    return;
  }
  await AsyncStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = async () => {
  await AsyncStorage.removeItem(TOKEN_KEY);
};

export const apiFetch = async (path, { method = 'GET', body, auth = true } = {}) => {
  const token = auth ? await getToken() : null;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((data && (data.message || data.error)) || `Request failed with status ${res.status}`);
  }
  return data;
};

export const api = {
  register: (payload) => apiFetch('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => apiFetch('/auth/login', { method: 'POST', body: payload }),
  me: () => apiFetch('/auth/me'),
  donations: async (params = {}) => {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');
    return apiFetch(`/donations${qs ? `?${qs}` : ''}`);
  },
  createDonation: (payload) => apiFetch('/donations', { method: 'POST', body: payload }),
  donationById: (id) => apiFetch(`/donations/${id}`),
  updateDonationStatus: (id, status) => apiFetch(`/donations/${id}/status`, { method: 'PATCH', body: { status } }),
  requests: async (params = {}) => {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');
    return apiFetch(`/requests${qs ? `?${qs}` : ''}`);
  },
  createRequest: (payload) => apiFetch('/requests', { method: 'POST', body: payload }),
  updateRequestStatus: (id, status) => apiFetch(`/requests/${id}/status`, { method: 'PATCH', body: { status } }),
  deliveries: async (params = {}) => {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');
    return apiFetch(`/deliveries${qs ? `?${qs}` : ''}`);
  },
  updateDeliveryStatus: (id, status) => apiFetch(`/deliveries/${id}/status`, { method: 'PATCH', body: { status } }),
  stats: (role) => apiFetch(`/stats/${role}`),
  aiPredict: (imageBase64, mimeType = 'image/jpeg') => apiFetch('/ai/predict', { method: 'POST', body: { imageBase64, mimeType } }),
  aiHealth: () => apiFetch('/ai/health', { auth: false }),
};
