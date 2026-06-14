import { BusinessType, VerificationTier, SupportedCity } from '../enums';

export { BusinessType, VerificationTier, SupportedCity };

export interface Business {
  id: string;
  userId: string;
  name: string;
  type: BusinessType;
  description: string | null;
  address: string;
  city: SupportedCity;
  lat: number;
  lng: number;
  verificationTier: VerificationTier;
  cacNumber: string | null;
  photoUrls: string[];
  commissionRate: number;
  avgRating: number;
  totalRatings: number;
  foodSavedKg: number;
  co2SavedKg: number;
  payoutBalance: number;
  createdAt: Date;
  updatedAt: Date;
}
