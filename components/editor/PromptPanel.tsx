'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Home, Bath, Maximize2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

export interface GenerateParams {
  description: string;
  bedrooms: number;
  bathrooms: number;
  totalArea: number;
  style: string;
  extras: string[];
}

interface PromptPanelProps {
  onGenerate: (params: GenerateParams) => void;
  isGenerating: boolean;
}

const STYLE_KEYS = [
  'modern',
  'traditional',
  'minimalist',
  'open-plan',
  'mediterranean',
  'scandinavian',
] as const;

const EXTRA_KEYS = [
  'Walk-in closet',
  'Home office',
  'Garage',
  'Balcony',
  'Laundry room',
  'Pantry',
  'Guest room',
  'Open kitchen',
  'Mudroom',
  'Sunroom',
] as const;

export default function PromptPanel({ onGenerate, isGenerating }: PromptPanelProps) {
  const { t } = useLanguage();
  const [description, setDescription] = useState('');
  const [bedrooms, setBedrooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(2);
  const [totalArea, setTotalArea] = useState(120);
  const [style, setStyle] = useState('modern');
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [showExtras, setShowExtras] = useState(false);

  function toggleExtra(extra: string) {
    setSelectedExtras((prev) =>
      prev.includes(extra) ? prev.filter((e) => e !== extra) : [...prev, extra]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onGenerate({ description, bedrooms, bathrooms, totalArea, style, extras: selectedExtras });
  }

  return (
    <div className="h-full overflow-y-auto p-4 flex flex-col gap-4">
      <div>
        <h2 className="font-semibold text-gray-900 text-sm mb-0.5">{t.editor.promptPanelTitle}</h2>
        <p className="text-xs text-gray-400">{t.editor.promptPanelSubtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Description */}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">
            {t.editor.descriptionLabel}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t.editor.descriptionPlaceholder}
            className="input resize-none h-24 text-xs"
          />
        </div>

        {/* Bedrooms & Bathrooms */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
              <Home className="w-3 h-3" />
              {t.editor.bedroomsLabel}
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBedrooms((v) => Math.max(1, v - 1))}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
              >
                −
              </button>
              <span className="text-sm font-semibold text-gray-900 w-4 text-center">{bedrooms}</span>
              <button
                type="button"
                onClick={() => setBedrooms((v) => Math.min(10, v + 1))}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
              <Bath className="w-3 h-3" />
              {t.editor.bathroomsLabel}
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBathrooms((v) => Math.max(1, v - 1))}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
              >
                −
              </button>
              <span className="text-sm font-semibold text-gray-900 w-4 text-center">{bathrooms}</span>
              <button
                type="button"
                onClick={() => setBathrooms((v) => Math.min(6, v + 1))}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Total Area */}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
            <Maximize2 className="w-3 h-3" />
            {t.editor.totalAreaLabel}: <span className="text-green-600 font-semibold ml-1">{totalArea} m²</span>
          </label>
          <input
            type="range"
            min={50}
            max={500}
            step={10}
            value={totalArea}
            onChange={(e) => setTotalArea(Number(e.target.value))}
            className="w-full accent-green-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>50 m²</span>
            <span>500 m²</span>
          </div>
        </div>

        {/* Style */}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">
            {t.editor.styleLabel}
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {STYLE_KEYS.map((sKey) => (
              <button
                key={sKey}
                type="button"
                onClick={() => setStyle(sKey)}
                className={cn(
                  'px-3 py-2 rounded-lg text-xs font-medium border transition-all',
                  style === sKey
                    ? 'bg-green-600 text-white border-green-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                )}
              >
                {t.editor.styles[sKey]}
              </button>
            ))}
          </div>
        </div>

        {/* Extras */}
        <div>
          <button
            type="button"
            onClick={() => setShowExtras(!showExtras)}
            className="flex items-center justify-between w-full text-xs font-medium text-gray-600 mb-1.5"
          >
            <span>
              {t.editor.extrasLabel} {selectedExtras.length > 0 && <span className="ml-1 text-green-600">({selectedExtras.length})</span>}
            </span>
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showExtras && 'rotate-180')} />
          </button>
          {showExtras && (
            <div className="flex flex-wrap gap-1.5">
              {EXTRA_KEYS.map((extraKey) => (
                <button
                  key={extraKey}
                  type="button"
                  onClick={() => toggleExtra(extraKey)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs border transition-all',
                    selectedExtras.includes(extraKey)
                      ? 'bg-green-100 text-green-700 border-green-300 font-medium'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-green-200'
                  )}
                >
                  {t.editor.extras[extraKey]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Generate Button */}
        <button
          type="submit"
          disabled={isGenerating}
          className="btn-primary w-full py-3 mt-2 font-semibold shadow-md"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t.editor.generatingBtn}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {t.editor.generateBtn}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
