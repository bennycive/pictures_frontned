import api from './client';
import type { Paginated, Artwork, Category, Currency, Auction, Cart, Order, Profile, Wallet, ActivityLog, TokenResponse, User } from './types';

// Auth
export const authApi = {
  login: (data: { login: string; password: string }) =>
    api.post<TokenResponse>('/api/auth/login', data),
  register: (data: { name: string; email?: string; phone?: string; password: string }) =>
    api.post('/api/auth/register', data),
  verifyAccount: (data: { identifier: string; code: string }) =>
    api.post('/api/auth/verify-account', data),
  forgotPassword: (data: { login: string }) =>
    api.post('/api/auth/forgot-password', data),
  resetPassword: (data: { login: string; code: string; password: string; password_confirmation: string }) =>
    api.post('/api/auth/reset-password', data),
  logout: (refresh_token: string) =>
    api.post('/api/logout', { refresh_token }),
  me: () => api.get<User>('/api/me'),
};

// Artworks
export const artworksApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<Paginated<Artwork>>('/api/artworks/', { params }),
  get: (uuid: string, currency?: string) =>
    api.get<Artwork>(`/api/artworks/${uuid}/`, { params: { currency } }),
  create: (data: FormData) =>
    api.post<Artwork>('/api/artworks/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (uuid: string, data: FormData) =>
    api.put<Artwork>(`/api/artworks/${uuid}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  patch: (uuid: string, data: Partial<Record<string, unknown>>) =>
    api.patch<Artwork>(`/api/artworks/${uuid}/`, data),
  delete: (uuid: string) =>
    api.delete(`/api/artworks/${uuid}/`),
};

// Categories
export const categoriesApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<Paginated<Category>>('/api/categories/', { params }),
  get: (uuid: string) => api.get<Category>(`/api/categories/${uuid}/`),
  create: (data: { name: string; description?: string }) => api.post<Category>('/api/categories/', data),
  update: (uuid: string, data: { name: string; description?: string }) =>
    api.put<Category>(`/api/categories/${uuid}/`, data),
  delete: (uuid: string) => api.delete(`/api/categories/${uuid}/`),
};

export const currenciesPublicApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<Paginated<Currency>>('/api/currencies/public/', { params }),
};

// Currencies
export const currenciesApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<Paginated<Currency>>('/api/currencies/', { params }),
  get: (uuid: string) => api.get<Currency>(`/api/currencies/${uuid}/`),
  create: (data: { code: string; symbol: string; exchange_rate: string }) =>
    api.post<Currency>('/api/currencies/', data),
  update: (uuid: string, data: { code: string; symbol: string; exchange_rate: string }) =>
    api.put<Currency>(`/api/currencies/${uuid}/`, data),
  patch: (uuid: string, data: Partial<{ code: string; symbol: string; exchange_rate: string }>) =>
    api.patch<Currency>(`/api/currencies/${uuid}/`, data),
  delete: (uuid: string) => api.delete(`/api/currencies/${uuid}/`),
};

// Auctions
export const auctionsApi = {
  list: () => api.get<Auction[]>('/api/auctions/'),
  get: (uuid: string) => api.get<Auction>(`/api/auctions/${uuid}/`),
  create: (data: Record<string, unknown>) => api.post<Auction>('/api/auctions/', data),
  start: (uuid: string) => api.post(`/api/auctions/${uuid}/start/`),
  end: (uuid: string) => api.post(`/api/auctions/${uuid}/end/`),
  bid: (uuid: string, amount: string) =>
    api.post(`/api/auctions/${uuid}/bid/`, { amount }),
};

// Cart
export const cartApi = {
  get: () => api.get<Cart>('/api/cart/'),
  addItem: (artwork_uuid: string) =>
    api.post('/api/cart/items/', { artwork_uuid }),
  removeItem: (uuid: string) =>
    api.delete(`/api/cart/items/${uuid}/`),
};

// Orders
export const ordersApi = {
  list: (params?: Record<string, unknown>) => api.get<Order[]>('/api/orders/', { params }),
  get: (uuid: string) => api.get<Order>(`/api/orders/${uuid}/`),
  checkout: (data: Record<string, unknown>) =>
    api.post<Order>('/api/orders/checkout/', data),
  updateStatus: (uuid: string, status: string) =>
    api.put<Order>(`/api/orders/${uuid}/status/`, { status }),
};

// Profile
export const profileApi = {
  get: () => api.get<Profile>('/api/profile/'),
  update: (data: FormData | Record<string, unknown>) =>
    api.post('/api/profile/', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    }),
  removeAvatar: () => api.delete('/api/profile/avatar'),
};

// Wallet
export const walletApi = {
  get: () => api.get<Wallet>('/api/wallet/'),
  deposit: (amount: string, description?: string) =>
    api.post<Wallet>('/api/wallet/deposit/', { amount, description }),
};

// Activity Logs
export const activityLogsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<Paginated<ActivityLog>>('/api/activity-logs/', { params }),
};
