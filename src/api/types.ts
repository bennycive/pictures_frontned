export interface User {
  uuid: string;
  name: string;
  email: string | null;
  phone: string | null;
  verified_at: string | null;
  roles: string[];
  permissions: string[];
  is_staff?: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface Category {
  uuid: string;
  name: string;
  slug: string;
  description: string;
  artworks_count: number;
}

export interface ArtworkPricing {
  base_usd: number;
  converted_amount: number;
  currency_code: string;
  currency_symbol: string;
  formatted: string;
}

export interface ArtworkImage {
  id: number;
  image_url: string | null;
  is_primary: boolean;
  order: number;
  created_at: string;
}

export interface Artwork {
  uuid: string;
  name: string;
  dimensions: string;
  category: Category;
  pricing: ArtworkPricing | null;
  image_url: string;
  images: ArtworkImage[];
  primary_image: string | null;
  is_sold: boolean;
  created_at: string;
}

export interface AuctionImage {
  id: number;
  image_url: string | null;
  is_primary: boolean;
  order: number;
  created_at: string;
}

export interface Auction {
  uuid: string;
  artwork_uuid: string;
  artwork_name: string;
  artwork_image: string;
  images: AuctionImage[];
  primary_image: string | null;
  created_by_name: string;
  start_price: string;
  reserve_price: string | null;
  current_price: string | null;
  bid_increment: string;
  minimum_next_bid: string;
  currency: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'live' | 'ended' | 'cancelled';
  winner_name: string | null;
  total_bids: number;
  unique_bidders: number;
  top_bids: AuctionBid[];
  seconds_remaining: number;
  payment_status: 'pending' | 'paid' | 'expired' | null;
  payment_deadline: string | null;
  created_at: string;
}

export interface AuctionBid {
  uuid: string;
  bidder_name: string;
  amount: string;
  is_winning: boolean;
  created_at: string;
}

export interface AuctionConfig {
  payment_mode: 'free_bid' | 'balance_required' | 'auto_deduct';
  payment_deadline_hours: number;
  max_violations: number;
  ban_duration_days: number;
  relist_on_expired: boolean;
  relist_duration_hours: number;
  updated_at: string;
}

export interface AuctionWinner {
  id: number;
  auction_uuid: string;
  artwork_name: string;
  user_name: string;
  user_email: string;
  bid_amount: string;
  currency: string;
  payment_mode: string;
  payment_status: 'pending' | 'paid' | 'expired';
  payment_deadline: string | null;
  paid_at: string | null;
  is_overdue: boolean;
  hours_remaining: number | null;
  created_at: string;
}

export interface AuctionViolation {
  id: number;
  user_uuid: string;
  user_name: string;
  user_email: string;
  artwork_name: string;
  auction_uuid: string;
  bid_amount: string;
  user_banned_until: string | null;
  user_total_violations: number;
  created_at: string;
}

export interface BlockedIP {
  id: number;
  ip: string;
  reason: string;
  is_permanent: boolean;
  expires_at: string | null;
  blocked_by: number | null;
  blocked_by_name: string | null;
  created_at: string;
}

export interface BlockedDevice {
  id: number;
  device_signature: string;
  signature_short: string;
  ip: string | null;
  user_agent: string;
  reason: string;
  is_permanent: boolean;
  expires_at: string | null;
  blocked_by: number | null;
  blocked_by_name: string | null;
  created_at: string;
}

export interface RateLimitViolation {
  id: number;
  device_signature: string;
  signature_short: string;
  ip: string | null;
  user_agent: string;
  violation_count: number;
  first_violation: string;
  last_violation: string;
}

export interface SecurityConfig {
  rate_limit_requests: number;
  rate_limit_window: number;
  auto_block_threshold: number;
  updated_at: string;
}

export interface SecurityStats {
  summary: {
    total_requests_today: number;
    total_requests_week: number;
    avg_response_time_ms: number;
    error_rate_percent: number;
    blocked_ips: number;
    blocked_devices: number;
    violations: number;
  };
  requests_by_method: { method: string; count: number }[];
  requests_hourly: { hour: string; count: number }[];
  status_distribution: { status_code: number | null; count: number }[];
  top_paths: { path: string; method: string; count: number; avg_ms: number | null }[];
  top_ips: { ip: string; count: number; avg_ms: number | null; is_blocked: boolean }[];
  recent_violations: { ip: string; violation_count: number; last_violation: string }[];
  recent_blocked: { ip: string; reason: string; is_permanent: boolean; created_at: string }[];
}

export interface Bid {
  uuid: string;
  bidder_name: string;
  amount: string;
  is_winning: boolean;
  created_at: string;
}

export interface Currency {
  uuid: string;
  code: string;
  symbol: string;
  rate: string;
}

export interface CartItem {
  uuid: string;
  artwork_uuid: string;
  artwork_name: string;
  artwork_image: string;
  source: 'manual' | 'auction_win';
  price: string;
  currency: string;
  created_at: string;
}

export interface Cart {
  uuid: string;
  items: CartItem[];
  total: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  artwork_name: string;
  price: string;
  currency: string;
}

export interface OrderStatusHistory {
  id: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  note: string;
  changed_by_name: string | null;
  created_at: string;
}

export interface Order {
  uuid: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total: string;
  currency: string;
  payment_channel: string;
  items: OrderItem[];
  status_history: OrderStatusHistory[];
  delivery_name: string;
  delivery_phone: string;
  delivery_address: string;
  delivery_city: string;
  delivery_country: string;
  notes: string;
  created_at: string;
  updated_at: string;
  buyer_uuid?: string;
  buyer_name?: string;
  buyer_email?: string;
}

export interface PaymentMethod {
  id?: number;
  channel: 'bank_transfer' | 'stripe' | 'selcom';
  display_name: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  config: Record<string, string>;
  updated_at?: string;
  public_config?: Record<string, string>;
}

export interface PaymentTransaction {
  id: number;
  order_uuid: string;
  user_name: string;
  user_email: string;
  channel: string;
  amount: string;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  reference: string;
  proof_image: string | null;
  external_id: string;
  admin_notes: string;
  confirmed_by_name: string | null;
  created_at: string;
  paid_at: string | null;
  updated_at: string;
}

export interface InitiatePaymentResponse {
  transaction_id: number;
  channel: string;
  amount: string;
  currency: string;
  // bank_transfer
  bank_details?: {
    bank_name: string;
    account_number: string;
    account_name: string;
    branch: string;
    swift_code: string;
    instructions: string;
  };
  // stripe
  client_secret?: string;
  publishable_key?: string;
  // selcom
  payment_url?: string;
}

export interface Profile {
  uuid: string;
  bio: string | null;
  avatar_url: string;
  address: string | null;
  city: string | null;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: number;
  type: 'deposit' | 'deduction' | 'refund';
  amount: string;
  balance_after: string;
  description: string;
  reference: string;
  created_at: string;
}

export interface Wallet {
  id: number;
  balance: string;
  currency: string;
  transactions: WalletTransaction[];
  updated_at: string;
}

export interface ActivityLog {
  id: number;
  log_name: string | null;
  description: string;
  event: string | null;
  subject_type: number | null;
  subject_id: number | null;
  subject: string;
  causer: number | null;
  causer_name: string;
  properties: unknown;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: number;
  codename: string;
  name: string;
  content_type: string;
}

export interface Role {
  id: number;
  name: string;
  permissions: Permission[];
  users_count: number;
}

export interface AdminUser {
  uuid: string;
  name: string;
  email: string | null;
  phone: string | null;
  is_staff: boolean;
  is_active: boolean;
  verified_at: string | null;
  bidding_banned_until: string | null;
  roles: string[];
  permissions: string[];
  direct_permissions: Permission[];
  created_at: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface HeroContent {
  tagline: string;
  title: string;
  subtitle: string;
  cta_text: string;
  cta_link: string;
  updated_at: string;
}

export interface LandingHero {
  image_url: string | null;
  favicon_url: string | null;
  updated_at: string;
}

export interface ContactInfo {
  email: string;
  phone: string;
  location: string;
  updated_at: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'unread';
  created_at: string;
  updated_at: string;
}

export interface ArtistProfile {
  name: string;
  location: string;
  photo_url: string | null;
  biography: string;
  story: string;
  philosophy: string;
  statement: string;
  updated_at: string;
}

export interface Exhibition {
  id: number;
  date_label: string;
  title: string;
  location: string;
  order: number;
}

export interface Address {
  id: number;
  label: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ErrorRequestLog {
  id: number;
  ip: string;
  method: string;
  path: string;
  status_code: number | null;
  response_time_ms: number | null;
  user_agent: string;
  created_at: string;
}

export interface NotificationLog {
  id: number;
  channel: 'email' | 'sms';
  recipient: string;
  subject: string | null;
  message: string;
  status: 'sent' | 'failed';
  error: string | null;
  causer_name: string | null;
  sent_at: string;
}

export interface AdminWallet {
  id: number;
  user_uuid: string;
  user_name: string;
  user_email: string;
  balance: string;
  currency: string;
  updated_at: string;
}
