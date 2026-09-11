export type Listing = {
  slug: string;
  business: string;
  title: string;
  area: string;
  distance: string;
  price: number;
  originalPrice: number;
  pickup: string;
  left: number;
  image: string;
  category: string;
  verified?: boolean;
};

export const listings: Listing[] = [
  { slug: 'lekki-fresh-bakes', business: 'Lekki Fresh Bakes', title: 'Evening Bakery Surprise Bag', area: 'Lekki Phase 1', distance: '1.2 km away', price: 1200, originalPrice: 3000, pickup: 'Today, 6:00–7:00 PM', left: 2, category: 'Bakery', verified: true, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=85' },
  { slug: 'yaba-kitchen-collective', business: 'Yaba Kitchen Collective', title: 'Dinner Surprise Bag', area: 'Yaba', distance: '2.4 km away', price: 1800, originalPrice: 4500, pickup: 'Today, 7:00–8:00 PM', left: 5, category: 'Restaurant', verified: true, image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85' },
  { slug: 'ikoyi-coffee-house', business: 'Ikoyi Coffee House', title: 'Coffee & Pastry Bag', area: 'Ikoyi', distance: '3.1 km away', price: 1400, originalPrice: 3500, pickup: 'Today, 5:30–6:30 PM', left: 1, category: 'Cafe', image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=85' },
  { slug: 'surulere-market-deli', business: 'Surulere Market Deli', title: 'Fresh Market Bag', area: 'Surulere', distance: '4.8 km away', price: 1500, originalPrice: 3800, pickup: 'Tomorrow, 10:00–11:00 AM', left: 4, category: 'Supermarket', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=85' },
];

export const naira = (amount: number): string => `₦${amount.toLocaleString('en-NG')}`;
