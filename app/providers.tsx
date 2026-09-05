'use client';

import { SessionProvider } from 'next-auth/react';
import { LanguageProvider } from '@/context/LanguageContext';
import { useState, useEffect } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <SessionProvider basePath="/api/auth" session={isClient ? undefined : null}>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </SessionProvider>
  );
}
