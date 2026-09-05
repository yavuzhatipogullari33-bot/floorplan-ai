'use client';

import { useState, use } from 'react';
import { ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';
import PromptPanel, { GenerateParams } from '@/components/editor/PromptPanel';
import FloorPlanCanvas from '@/components/editor/FloorPlanCanvas';
import ChatPanel from '@/components/editor/ChatPanel';
import { FloorPlanLayout } from '@/lib/svg-generator';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';

export default function EditorPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const { t, language } = useLanguage();

  const [layout, setLayout] = useState<FloorPlanLayout | null>(null);
  const [svgData, setSvgData] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [projectName, setProjectName] = useState(language === 'tr' ? 'İsimsiz Kat Planı' : 'Untitled Floor Plan');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(params: GenerateParams) {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: projectId !== 'new' ? projectId : undefined,
          ...params,
          language,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Generation failed');
      }

      setLayout(data.layout);
      setSvgData(data.svg);
      setSaveStatus('saved');
    } catch (err) {
      setError(String(err));
    } finally {
      setIsGenerating(false);
    }
  }

  function handleLayoutUpdate(newLayout: FloorPlanLayout, newSvg: string) {
    setLayout(newLayout);
    setSvgData(newSvg);
    setSaveStatus('saved');
  }

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors flex items-center gap-1 text-xs font-medium"
            title={t.editor.backToDashboard}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t.nav.dashboard}</span>
          </Link>
          <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
            <div className="w-6 h-6 bg-green-600 rounded-md flex items-center justify-center">
              <Home className="w-3 h-3 text-white" />
            </div>
            <input
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value);
                setSaveStatus('unsaved');
              }}
              className="text-sm font-semibold text-gray-900 bg-transparent border-none outline-none focus:bg-gray-50 focus:px-2 rounded transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {error && (
            <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded-lg max-w-xs truncate">
              {error}
            </span>
          )}

          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            {saveStatus === 'saving' ? (
              <><div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />{t.editor.saving}</>
            ) : saveStatus === 'saved' ? (
              <><div className="w-2 h-2 rounded-full bg-green-400" />{t.editor.saved}</>
            ) : (
              <><div className="w-2 h-2 rounded-full bg-gray-300" />{t.editor.unsaved}</>
            )}
          </div>

          <LanguageSelector />
        </div>
      </header>

      {/* Main 3-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Prompt Panel */}
        <div className="w-80 flex-shrink-0 border-r border-gray-200 overflow-hidden flex flex-col bg-white">
          <PromptPanel onGenerate={handleGenerate} isGenerating={isGenerating} />
        </div>

        {/* Center: Floor Plan Canvas */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <FloorPlanCanvas
            svgData={svgData}
            layout={layout}
            isGenerating={isGenerating}
            onLayoutChange={handleLayoutUpdate}
          />
        </div>

        {/* Right: Chat Panel */}
        <div className="w-80 flex-shrink-0 border-l border-gray-200 overflow-hidden flex flex-col bg-white">
          <ChatPanel
            currentLayout={layout}
            projectId={projectId !== 'new' ? projectId : undefined}
            onLayoutUpdate={handleLayoutUpdate}
            disabled={!layout}
          />
        </div>
      </div>
    </div>
  );
}
