'use client';

import { useState, useEffect, use } from 'react';
import { ArrowLeft, Home, Sparkles, SlidersHorizontal, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import PromptPanel, { GenerateParams } from '@/components/editor/PromptPanel';
import FloorPlanCanvas from '@/components/editor/FloorPlanCanvas';
import ChatPanel from '@/components/editor/ChatPanel';
import { FloorPlanLayout, generateSVG } from '@/lib/svg-generator';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';
import ProjectSetupWizardModal from '@/components/wizard/ProjectSetupWizardModal';
import { useWizardStore } from '@/lib/stores/wizardStore';
import { cn } from '@/lib/utils';

export default function EditorPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const { t, language } = useLanguage();
  const { openWizard } = useWizardStore();

  const [layout, setLayout] = useState<FloorPlanLayout | null>(null);
  const [svgData, setSvgData] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [projectName, setProjectName] = useState(language === 'tr' ? 'İsimsiz Kat Planı' : 'Untitled Floor Plan');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [error, setError] = useState<string | null>(null);

  // Spacious UI panel toggle states (Ferahlatma & Sadeleştirme)
  const [showPromptPanel, setShowPromptPanel] = useState(true);
  const [showChatPanel, setShowChatPanel] = useState(false);

  // Load project on mount
  useEffect(() => {
    if (projectId && projectId !== 'new') {
      fetch(`/api/projects/${projectId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.project) {
            if (data.project.name) {
              setProjectName(data.project.name);
            }
            if (data.project.layoutJson) {
              try {
                const parsed = JSON.parse(data.project.layoutJson) as FloorPlanLayout;
                setLayout(parsed);
                if (data.project.svgData) {
                  setSvgData(data.project.svgData);
                } else {
                  setSvgData(generateSVG(parsed, (language as 'tr' | 'en') || 'tr'));
                }
              } catch (e) {
                console.warn('Failed to parse saved layoutJson:', e);
              }
            }
          }
        })
        .catch((err) => console.warn('Failed to fetch project:', err));
    }
  }, [projectId, language]);

  // Open wizard if ?wizard=open in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('wizard') === 'open') {
        openWizard();
      }
    }
  }, [openWizard]);

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

    // Auto-save to project
    if (projectId && projectId !== 'new') {
      fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          layoutJson: JSON.stringify(newLayout),
          svgData: newSvg,
          totalArea: newLayout.totalArea,
        }),
      }).catch((e) => console.warn('Auto-save error:', e));
    }
  }

  async function handleProjectNameBlur() {
    if (projectId && projectId !== 'new') {
      setSaveStatus('saving');
      try {
        await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: projectName }),
        });
        setSaveStatus('saved');
      } catch {
        setSaveStatus('unsaved');
      }
    }
  }

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Project Setup Wizard Modal */}
      <ProjectSetupWizardModal
        projectId={projectId}
        onComplete={handleLayoutUpdate}
      />

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
              onBlur={handleProjectNameBlur}
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

          {/* Setup Wizard Trigger Button */}
          <button
            onClick={openWizard}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95"
            title={language === 'tr' ? 'Arsa, kat ve zonlama sihirbazı' : 'Lot, floors and zoning wizard'}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{language === 'tr' ? 'Kurulum Sihirbazı' : 'Setup Wizard'}</span>
          </button>

          {/* Panel Visibility Toggles (Ferah & Odaklanmış Çalışma Alanı) */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setShowPromptPanel(!showPromptPanel)}
              className={cn(
                'px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5',
                showPromptPanel ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              )}
              title={language === 'tr' ? 'Parametreler Panelini Göster/Gizle' : 'Toggle Parameters Panel'}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{language === 'tr' ? 'Parametreler' : 'Settings'}</span>
            </button>
            <button
              onClick={() => setShowChatPanel(!showChatPanel)}
              className={cn(
                'px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5',
                showChatPanel ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              )}
              title={language === 'tr' ? 'AI Asistan Sohbetini Göster/Gizle' : 'Toggle AI Chat'}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{language === 'tr' ? 'Sohbet' : 'Chat'}</span>
            </button>
          </div>

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

      {/* Main Spacious Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Prompt Panel */}
        {showPromptPanel && (
          <div className="w-80 flex-shrink-0 border-r border-gray-200 overflow-hidden flex flex-col bg-white animate-in slide-in-from-left duration-150">
            <PromptPanel onGenerate={handleGenerate} isGenerating={isGenerating} />
          </div>
        )}

        {/* Center: Floor Plan Canvas (Gets Full Space when sidebars are closed!) */}
        <div className="flex-1 overflow-hidden flex flex-col min-w-0">
          <FloorPlanCanvas
            svgData={svgData}
            layout={layout}
            isGenerating={isGenerating}
            onLayoutChange={handleLayoutUpdate}
          />
        </div>

        {/* Right: Chat Panel */}
        {showChatPanel && (
          <div className="w-80 flex-shrink-0 border-l border-gray-200 overflow-hidden flex flex-col bg-white animate-in slide-in-from-right duration-150">
            <ChatPanel
              currentLayout={layout}
              projectId={projectId !== 'new' ? projectId : undefined}
              onLayoutUpdate={handleLayoutUpdate}
              disabled={!layout}
            />
          </div>
        )}
      </div>
    </div>
  );
}
