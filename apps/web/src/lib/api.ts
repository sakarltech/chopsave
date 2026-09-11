const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

export const apiBaseUrl = (configuredApiUrl || 'https://api-edo-languages-projects.vercel.app').replace(/\/$/, '');

type ApiErrorBody = {
  error?: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
  });

  const body = (await response.json().catch(() => ({}))) as T & ApiErrorBody;
  if (!response.ok) {
    throw new ApiError(body.error || 'Something went wrong. Please try again.', response.status);
  }

  return body;
}

function authenticatedRequest<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  return apiRequest(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
  });
}

export type AuthUser = {
  id: string;
  phone: string | null;
  email: string | null;
  fullName: string;
  role: string;
};

export type VerifyOtpResponse = {
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
  user: AuthUser;
};

export async function sendEmailOtp(email: string): Promise<{ message: string; email: string }> {
  return apiRequest('/auth/email-otp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
}

export async function verifyEmailOtp(params: {
  email: string;
  otp: string;
  fullName?: string;
}): Promise<VerifyOtpResponse> {
  return apiRequest('/auth/email-otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
}

export type BusinessApplication = {
  businessName: string;
  type: 'restaurant' | 'bakery' | 'buka' | 'canteen' | 'food_stall' | 'supermarket' | 'cloud_kitchen';
  cacNumber?: string;
  address: string;
  city: 'lagos';
  lat: number;
  lng: number;
  contactPhone: string;
  ownerFullName: string;
};

export type RegisteredBusiness = {
  id: string;
  name: string;
  verificationTier: string;
  status: 'pending';
  message: string;
};

export async function registerBusiness(accessToken: string, business: BusinessApplication): Promise<RegisteredBusiness> {
  return authenticatedRequest('/businesses/register', accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(business),
  });
}

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
  return apiRequest('/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
}

export async function getCurrentUser(accessToken: string): Promise<AuthUser> {
  return authenticatedRequest('/users/me', accessToken);
}

export type PendingBusiness = {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  cacNumber: string | null;
  ownerName: string;
  ownerEmail: string | null;
  contactPhone: string | null;
  createdAt: string;
};

export async function getPendingBusinesses(accessToken: string): Promise<{ businesses: PendingBusiness[]; total: number }> {
  return authenticatedRequest('/admin/businesses/pending', accessToken);
}

export async function approveBusiness(accessToken: string, businessId: string, tier?: 'verified_informal' | 'verified_cac'): Promise<void> {
  await authenticatedRequest(`/admin/businesses/${businessId}/approve`, accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tier ? { tier } : {}),
  });
}

export async function rejectBusiness(accessToken: string, businessId: string, reason: string): Promise<void> {
  await authenticatedRequest(`/admin/businesses/${businessId}/reject`, accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
}

export type MyBusiness = {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  verificationTier: 'pending' | 'verified_informal' | 'verified_cac' | 'rejected';
  rejectionReason: string | null;
  activeListingCount: number;
};

export async function getMyBusiness(accessToken: string): Promise<MyBusiness> {
  return authenticatedRequest('/businesses/me', accessToken);
}

export type ManagedListing = {
  id: string;
  businessId: string;
  type: 'surprise_bag' | 'itemised';
  title: string | null;
  description: string | null;
  originalPrice: number | null;
  discountPrice: number;
  quantityTotal: number;
  quantityRemaining: number;
  pickupStart: string;
  pickupEnd: string;
  foodCategories: string[];
  dietaryTags: string[];
  photoUrl: string | null;
  weightKg: number;
  status: 'active' | 'paused' | 'sold_out' | 'expired' | 'closed';
  createdAt: string;
  updatedAt: string;
};

export type CreateListing = {
  type: 'surprise_bag';
  title: string;
  description: string;
  originalPrice: number;
  discountPrice: number;
  quantityTotal: number;
  pickupStart: string;
  pickupEnd: string;
  foodCategories: string[];
  dietaryTags: string[];
  photoUrl?: string;
};

export async function getMyListings(accessToken: string): Promise<{ listings: ManagedListing[] }> {
  return authenticatedRequest('/listings/mine', accessToken);
}

export async function createListing(accessToken: string, listing: CreateListing): Promise<ManagedListing> {
  return authenticatedRequest('/listings', accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(listing),
  });
}

export async function updateListing(
  accessToken: string,
  listingId: string,
  listing: Pick<ManagedListing, 'title' | 'description' | 'pickupStart' | 'pickupEnd' | 'dietaryTags'>,
): Promise<void> {
  await authenticatedRequest(`/listings/${listingId}`, accessToken, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(listing),
  });
}

export async function updateListingStatus(
  accessToken: string,
  listingId: string,
  status: 'active' | 'paused' | 'sold_out' | 'closed',
): Promise<void> {
  await authenticatedRequest(`/listings/${listingId}/status`, accessToken, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}

export async function deleteListing(accessToken: string, listingId: string): Promise<void> {
  await authenticatedRequest(`/listings/${listingId}`, accessToken, { method: 'DELETE' });
}

export type NearbyListing = {
  id: string;
  type: string;
  title: string;
  description: string;
  discountPrice: number;
  originalPrice: number | null;
  quantityRemaining: number;
  pickupStart: string;
  pickupEnd: string;
  foodCategories: string[];
  dietaryTags: string[];
  photoUrl: string | null;
  status: string;
  business: {
    id: string;
    name: string;
    avgRating: number;
    verificationTier: string;
    address: string;
    city: string;
  };
  distanceMetres: number;
};

export async function getNearbyListings(params: {
  lat: number;
  lng: number;
  city?: string;
  query?: string;
}): Promise<{ listings: NearbyListing[]; total: number }> {
  const query = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
    radius: '50000',
    city: params.city || 'lagos',
  });

  if (params.query?.trim()) {
    query.set('q', params.query.trim());
  }

  return apiRequest(`/listings/nearby?${query.toString()}`);
}
