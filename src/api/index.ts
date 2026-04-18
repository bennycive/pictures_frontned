import api from './client';
import type { Paginated, Artwork, Category, Currency, Auction, Cart, Order, Profile, Wallet, ActivityLog, TokenResponse, User, Role, Permission, AdminUser, HeroContent, LandingHero, ContactInfo, ContactMessage, ArtistProfile, Exhibition, AdminWallet, BlockedIP, BlockedDevice, SecurityStats, SecurityConfig, RateLimitViolation } from './types';

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
  updateMe: (data: Partial<{ name: string; email: string | null; phone: string | null }>) =>
    api.patch<User>('/api/me/update', data),
};

// Artworks
export const artworksApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<Paginated<Artwork>>('/api/artworks/', { params }),
  get: (uuid: string, currency?: string) =>
    api.get<Artwork>(`/api/artworks/${uuid}/`, { params: { currency } }),
  create: (data: FormData) =>
    api.post<Artwork>('/api/artworks/', data, { headers: { 'Content-Type': undefined } }),
  update: (uuid: string, data: FormData) =>
    api.put<Artwork>(`/api/artworks/${uuid}/`, data, { headers: { 'Content-Type': undefined } }),
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
  list: (params?: Record<string, unknown>) => api.get<Auction[]>('/api/auctions/', { params }),
  get: (uuid: string) => api.get<Auction>(`/api/auctions/${uuid}/`),
  create: (data: Record<string, unknown>) => api.post<Auction>('/api/auctions/', data),
  update: (uuid: string, data: Record<string, unknown>) => api.patch<Auction>(`/api/auctions/${uuid}/`, data),
  delete: (uuid: string) => api.delete(`/api/auctions/${uuid}/`),
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
      headers: data instanceof FormData ? { 'Content-Type': undefined } : {},
    }),
  removeAvatar: () => api.delete('/api/profile/avatar'),
};

// Wallet
export const walletApi = {
  get: () => api.get<Wallet>('/api/wallet/'),
  deposit: (amount: string, description?: string) =>
    api.post<Wallet>('/api/wallet/deposit/', { amount, description }),
};

// Admin — Roles
export const rolesApi = {
  list: () => api.get<Role[]>('/api/admin/roles/'),
  get: (id: number) => api.get<Role>(`/api/admin/roles/${id}/`),
  create: (data: { name: string; permission_ids?: number[] }) =>
    api.post<Role>('/api/admin/roles/', data),
  update: (id: number, data: { name: string; permission_ids?: number[] }) =>
    api.put<Role>(`/api/admin/roles/${id}/`, data),
  delete: (id: number) => api.delete(`/api/admin/roles/${id}/`),
};

// Admin — Permissions
export const permissionsApi = {
  list: () => api.get<Permission[]>('/api/admin/permissions/'),
};

// Admin — Users
export const adminUsersApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<AdminUser[]>('/api/admin/users/', { params }),
  get: (uuid: string) => api.get<AdminUser>(`/api/admin/users/${uuid}/`),
  update: (uuid: string, data: Partial<Pick<AdminUser, 'name' | 'email' | 'phone' | 'is_staff' | 'is_active'>>) =>
    api.patch<AdminUser>(`/api/admin/users/${uuid}/`, data),
  assignRole: (uuid: string, role_name: string) =>
    api.post<AdminUser>(`/api/admin/users/${uuid}/assign-role/`, { role_name }),
  removeRole: (uuid: string, role_name: string) =>
    api.post<AdminUser>(`/api/admin/users/${uuid}/remove-role/`, { role_name }),
};

// Reports (admin-only)
export const reportsApi = {
  auctions: (params?: Record<string, string>) =>
    api.get('/api/reports/auctions/', { params }),
  soldArtworks: (params?: Record<string, string>) =>
    api.get('/api/reports/artworks/sold/', { params }),
  availableArtworks: (params?: Record<string, string>) =>
    api.get('/api/reports/artworks/available/', { params }),
  sales: (params?: Record<string, string>) =>
    api.get('/api/reports/sales/', { params }),
};

// Activity Logs
export const activityLogsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<Paginated<ActivityLog>>('/api/activity-logs/', { params }),
};

// Site Config
export const siteApi = {
  // Landing hero text content
  getHeroContent: () => api.get<HeroContent>('/api/site/hero-content/'),
  updateHeroContent: (data: Partial<Omit<HeroContent, 'updated_at'>>) =>
    api.patch<HeroContent>('/api/site/hero-content/', data),

  // Landing hero image
  getHero: () => api.get<LandingHero>('/api/site/hero/'),
  updateHero: (data: FormData) =>
    api.put<LandingHero>('/api/site/hero/', data, { headers: { 'Content-Type': undefined } }),

  // Contact info
  getContactInfo: () => api.get<ContactInfo>('/api/site/contact-info/'),
  updateContactInfo: (data: Partial<ContactInfo>) =>
    api.patch<ContactInfo>('/api/site/contact-info/', data),

  // Contact messages
  submitContact: (data: { name: string; email: string; subject: string; message: string }) =>
    api.post<{ detail: string }>('/api/site/contact/', data),
  getUnreadCount: () =>
    api.get<{ count: number }>('/api/site/contact/messages/unread-count/'),
  listMessages: (params?: Record<string, unknown>) =>
    api.get<Paginated<ContactMessage>>('/api/site/contact/messages/', { params }),
  updateMessageStatus: (id: number, status: 'new' | 'read' | 'unread') =>
    api.patch<ContactMessage>(`/api/site/contact/messages/${id}/status/`, { status }),
  deleteMessage: (id: number) =>
    api.delete(`/api/site/contact/messages/${id}/`),

  // Artist profile
  getArtistProfile: () => api.get<ArtistProfile>('/api/site/artist/'),
  updateArtistProfile: (data: FormData) =>
    api.patch<ArtistProfile>('/api/site/artist/', data, { headers: { 'Content-Type': undefined } }),

  // Exhibitions
  listExhibitions: () => api.get<Exhibition[]>('/api/site/exhibitions/'),
  createExhibition: (data: Omit<Exhibition, 'id'>) => api.post<Exhibition>('/api/site/exhibitions/', data),
  updateExhibition: (id: number, data: Omit<Exhibition, 'id'>) =>
    api.put<Exhibition>(`/api/site/exhibitions/${id}/`, data),
  deleteExhibition: (id: number) => api.delete(`/api/site/exhibitions/${id}/`),
};

// Security — blocked IPs, violations, performance stats
export const securityApi = {
  stats:              () => api.get<SecurityStats>('/api/security/stats/'),
  blockedIPs:         (search?: string) =>
    api.get<BlockedIP[]>('/api/security/blocked-ips/', { params: search ? { search } : {} }),
  blockIP:            (data: { ip: string; reason?: string; is_permanent?: boolean }) =>
    api.post<BlockedIP>('/api/security/blocked-ips/', data),
  unblockIP:          (id: number) => api.delete(`/api/security/blocked-ips/${id}/`),
  blockedDevices:     (search?: string) =>
    api.get<BlockedDevice[]>('/api/security/blocked-devices/', { params: search ? { search } : {} }),
  unblockDevice:      (id: number) => api.delete(`/api/security/blocked-devices/${id}/`),
  violations:         (search?: string) =>
    api.get<RateLimitViolation[]>('/api/security/violations/', { params: search ? { search } : {} }),
  clearViolation:     (id: number) => api.delete(`/api/security/violations/${id}/`),
  blockFromViolation: (id: number) => api.post<BlockedIP>(`/api/security/violations/${id}/block/`),
  getConfig:          () => api.get<SecurityConfig>('/api/security/config/'),
  updateConfig:       (data: Partial<Omit<SecurityConfig, 'updated_at'>>) =>
    api.patch<SecurityConfig>('/api/security/config/', data),
};

// Admin wallet management
export const adminWalletsApi = {
  list: (search?: string) =>
    api.get<AdminWallet[]>('/api/admin/wallets/', { params: search ? { search } : {} }),
  credit: (id: number, amount: string, description: string) =>
    api.post<AdminWallet>(`/api/admin/wallets/${id}/credit/`, { amount, description }),
};
