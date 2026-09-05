import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://floorplan-ai.vercel.app'),
  title: 'FloorPlan AI — Yapay Zeka ile Kat Planı Oluşturucu',
  description:
    'Yapay zeka ile saniyeler içinde mimari kat planları üretin, sohbet ederek düzenleyin ve dışa aktarın.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
