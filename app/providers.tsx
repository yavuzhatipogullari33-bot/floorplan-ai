'use client';

import dynamic from 'next/dynamic';
import { LanguageProvider } from '@/context/LanguageContext';

const DynamicSessionProvider = dynamic(
  () => import('next-auth/react').then((mod) => mod.SessionProvider),
  { ssr: false }
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DynamicSessionProvider>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </DynamicSessionProvider>
  );
}
