export interface Rating {
  id: string;
  reservationId: string;
  raterId: string;
  rateeId: string;
  rateeType: 'business' | 'consumer';
  stars: 1 | 2 | 3 | 4 | 5;
  review: string | null;
  flagTag: string | null;
  createdAt: Date;
}
