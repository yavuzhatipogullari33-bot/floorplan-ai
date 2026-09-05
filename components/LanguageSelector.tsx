'use client';

import { useLanguage } from '@/context/LanguageContext';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LanguageSelectorProps {
  variant?: 'compact' | 'pill' | 'minimal';
  className?: string;
}

export default function LanguageSelector({ variant = 'pill', className }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className={cn(
        'inline-flex items-center bg-gray-100/90 border border-gray-200/80 p-0.5 rounded-lg text-xs font-medium shadow-sm transition-all',
        className
      )}
    >
      <button
        type="button"
        onClick={() => setLanguage('tr')}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all duration-150',
          language === 'tr'
            ? 'bg-white text-gray-900 shadow-sm font-semibold'
            : 'text-gray-500 hover:text-gray-800'
        )}
        title="Türkçe"
      >
        <span className="text-xs">🇹🇷</span>
        <span>TR</span>
      </button>

      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all duration-150',
          language === 'en'
            ? 'bg-white text-gray-900 shadow-sm font-semibold'
            : 'text-gray-500 hover:text-gray-800'
        )}
        title="English"
      >
        <span className="text-xs">🇬🇧</span>
        <span>EN</span>
      </button>
    </div>
  );
}
