import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ChopSave — Good food. Less waste. Better prices.',
  description: 'Reserve quality surplus food from nearby Lagos businesses at great prices.',
  applicationName: 'ChopSave',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
