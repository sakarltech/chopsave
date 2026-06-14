import { ListingType, ListingStatus, FoodCategory, DietaryTag } from '../enums';

export { ListingType, ListingStatus };

export interface ListingItem {
  id: string;
  listingId: string;
  name: string;
  description: string | null;
  originalPrice: number | null;
  discountPrice: number;
  quantityTotal: number;
  quantityRemaining: number;
  dietaryTags: DietaryTag[];
  photoUrl: string | null;
}

export interface Listing {
  id: string;
  businessId: string;
  type: ListingType;
  title: string | null;
  description: string | null;
  status: ListingStatus;
  originalPrice: number | null;
  discountPrice: number;
  quantityTotal: number;
  quantityRemaining: number;
  pickupStart: Date;
  pickupEnd: Date;
  foodCategories: FoodCategory[];
  dietaryTags: DietaryTag[];
  photoUrl: string | null;
  weightKg: number;
  items?: ListingItem[];
  createdAt: Date;
  updatedAt: Date;
}
