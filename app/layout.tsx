import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FloorPlan AI — Yapay Zeka ile Mimari Kat Planı Çizimi',
  description:
    'Google Gemini AI ile saniyeler içinde mimari standartlara uygun kat planları üretin, sohbet ederek veya sürükle-bırakla anında düzenleyin.',
  keywords: [
    'FloorPlan',
    'FloorPlan AI',
    'Kat Planı Oluşturucu',
    'AI Floor Plan Generator',
    'Mimari Kat Planı',
    'Ev Planı Çizimi',
    'Maket AI Alternatifi',
    'Architecture AI',
  ],
  authors: [{ name: 'FloorPlan AI Team' }],
  creator: 'FloorPlan AI',
  publisher: 'FloorPlan AI',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    alternateLocale: 'en_US',
    url: 'https://floorplan-ai.vercel.app',
    title: 'FloorPlan AI — Generate Custom Floor Plans in Minutes with AI',
    description:
      'Describe your space in natural language and get professional, editable architectural floor plans instantly.',
    siteName: 'FloorPlan AI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FloorPlan AI — AI Floor Plan Generator',
    description: 'Create editable vector floor plans in seconds with AI.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'FloorPlan AI',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description:
      'AI-powered architectural floor plan generator that creates editable layouts from natural text descriptions.',
  };

  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
