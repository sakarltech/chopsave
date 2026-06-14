import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ChopSave — Chop Well. Waste Nothing.',
  description: 'Rescue surplus food from nearby restaurants and businesses at 50-75% off. Lagos & Abuja, Nigeria.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
