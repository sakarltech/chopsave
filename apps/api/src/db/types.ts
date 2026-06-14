/**
 * Raw PostgreSQL row types — these mirror the DB schema column names exactly.
 * Use these in repositories. Convert to camelCase domain types before returning from services.
 */

export interface UserRow {
  id: string;
  phone: string | null;
  email: string | null;
  full_name: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  status: string;
  dietary_prefs: string[];
  fcm_token: string | null;
  notif_prefs: Record<string, boolean>;
  no_show_count: number;
  no_show_window_start: Date | null;
  suspended_until: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface BusinessRow {
  id: string;
  user_id: string;
  name: string;
  type: string;
  description: string | null;
  address: string;
  city: string;
  lat: string; // pg returns DECIMAL as string
  lng: string;
  verification_tier: string;
  cac_number: string | null;
  photo_urls: string[];
  commission_rate: string;
  avg_rating: string | null;
  total_ratings: number;
  food_saved_kg: string;
  co2_saved_kg: string;
  payout_balance: string;
  rejection_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ListingRow {
  id: string;
  business_id: string;
  type: string;
  title: string | null;
  description: string | null;
  status: string;
  original_price: string | null;
  discount_price: string;
  quantity_total: number;
  quantity_remaining: number;
  pickup_start: Date;
  pickup_end: Date;
  food_categories: string[];
  dietary_tags: string[];
  photo_url: string | null;
  weight_kg: string;
  created_at: Date;
  updated_at: Date;
}

export interface ReservationRow {
  id: string;
  consumer_id: string;
  listing_id: string;
  business_id: string;
  quantity: number;
  amount_paid: string;
  commission_rate: string;
  commission_amt: string;
  payout_amt: string;
  status: string;
  pickup_code: string;
  collected_at: Date | null;
  no_show_at: Date | null;
  cancelled_at: Date | null;
  cancel_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentRow {
  id: string;
  reservation_id: string;
  gateway: string;
  method: string;
  amount: string;
  currency: string;
  status: string;
  gateway_ref: string | null;
  gateway_meta: Record<string, unknown> | null;
  initiated_at: Date;
  confirmed_at: Date | null;
  refunded_at: Date | null;
  refund_ref: string | null;
}
