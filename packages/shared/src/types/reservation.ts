import { ReservationStatus } from '../enums';

export { ReservationStatus };

export interface ReservationItem {
  id: string;
  reservationId: string;
  listingItemId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Reservation {
  id: string;
  consumerId: string;
  listingId: string;
  businessId: string;
  quantity: number;
  amountPaid: number;
  commissionRate: number;
  commissionAmt: number;
  payoutAmt: number;
  status: ReservationStatus;
  pickupCode: string;
  collectedAt: Date | null;
  noShowAt: Date | null;
  cancelledAt: Date | null;
  cancelReason: string | null;
  items?: ReservationItem[];
  createdAt: Date;
  updatedAt: Date;
}
