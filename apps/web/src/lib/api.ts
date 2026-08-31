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

export type AuthUser = {
  id: string;
  phone: string;
  fullName: string;
  role: string;
};

export type VerifyOtpResponse = {
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
  user: AuthUser;
};

export async function sendOtp(phone: string): Promise<{ message: string; phone: string }> {
  return apiRequest('/auth/otp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
}

export async function verifyOtp(params: {
  phone: string;
  otp: string;
  fullName?: string;
}): Promise<VerifyOtpResponse> {
  return apiRequest('/auth/otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
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
