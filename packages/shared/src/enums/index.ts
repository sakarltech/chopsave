export enum UserRole {
  CONSUMER = 'consumer',
  BUSINESS_OWNER = 'business_owner',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

export enum BusinessType {
  RESTAURANT = 'restaurant',
  BAKERY = 'bakery',
  BUKA = 'buka',
  CANTEEN = 'canteen',
  FOOD_STALL = 'food_stall',
  SUPERMARKET = 'supermarket',
  CLOUD_KITCHEN = 'cloud_kitchen',
}

export enum VerificationTier {
  PENDING = 'pending',
  VERIFIED_INFORMAL = 'verified_informal',
  VERIFIED_CAC = 'verified_cac',
  REJECTED = 'rejected',
}

export enum ListingType {
  SURPRISE_BAG = 'surprise_bag',
  ITEMISED = 'itemised',
}

export enum ListingStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  SOLD_OUT = 'sold_out',
  EXPIRED = 'expired',
  CLOSED = 'closed',
}

export enum ReservationStatus {
  PENDING_PAYMENT = 'pending_payment',
  CONFIRMED = 'confirmed',
  READY = 'ready',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  DISPUTED = 'disputed',
}

export enum PaymentGateway {
  PAYSTACK = 'paystack',
  FLUTTERWAVE = 'flutterwave',
}

export enum PaymentMethod {
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  USSD = 'ussd',
  OPAY = 'opay',
  WALLET = 'wallet',
}

export enum PaymentStatus {
  INITIATED = 'initiated',
  PENDING = 'pending',
  SUCCESSFUL = 'successful',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PayoutStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum DisputeReason {
  FOOD_QUALITY = 'food_quality',
  FOOD_NOT_AVAILABLE = 'food_not_available',
  INCORRECT_ORDER = 'incorrect_order',
  OTHER = 'other',
}

export enum DisputeStatus {
  OPEN = 'open',
  UNDER_REVIEW = 'under_review',
  RESOLVED_REFUND = 'resolved_refund',
  RESOLVED_NO_REFUND = 'resolved_no_refund',
  CLOSED = 'closed',
}

export enum NotificationType {
  RESERVATION_CONFIRMED = 'reservation_confirmed',
  PICKUP_REMINDER_60 = 'pickup_reminder_60min',
  PICKUP_REMINDER_30 = 'pickup_reminder_30min',
  ORDER_READY = 'order_ready',
  ORDER_COLLECTED = 'order_collected',
  NO_SHOW = 'no_show',
  NEW_LISTING_NEARBY = 'new_listing_nearby',
  NEW_LISTING_FAVOURITE = 'new_listing_favourite',
  BUSINESS_APPROVED = 'business_approved',
  BUSINESS_REJECTED = 'business_rejected',
  PAYOUT_PROCESSED = 'payout_processed',
  PAYOUT_FAILED = 'payout_failed',
  REFUND_INITIATED = 'refund_initiated',
  LISTING_CANCELLED = 'listing_cancelled',
  DISPUTE_OPENED = 'dispute_opened',
  DISPUTE_RESOLVED = 'dispute_resolved',
  ACCOUNT_SUSPENDED = 'account_suspended',
}

export enum NotificationChannel {
  PUSH = 'push',
  SMS = 'sms',
  IN_APP = 'in_app',
}

export enum FoodCategory {
  LOCAL_DISHES = 'local_dishes',
  FAST_FOOD = 'fast_food',
  PASTRIES = 'pastries',
  DRINKS = 'drinks',
  GROCERIES = 'groceries',
  CONTINENTAL = 'continental',
  SNACKS = 'snacks',
  OTHER = 'other',
}

export enum DietaryTag {
  HALAL = 'halal',
  VEGETARIAN = 'vegetarian',
  VEGAN = 'vegan',
  GLUTEN_FREE = 'gluten_free',
  BUKA_STYLE = 'buka_style',
  CONTAINS_PORK = 'contains_pork',
  CONTAINS_NUTS = 'contains_nuts',
}

export enum SupportedCity {
  LAGOS = 'lagos',
  ABUJA = 'abuja',
}
