'use client';

import React, { useState } from 'react';
import {
  X,
  Compass,
  Building,
  Layers,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  Maximize2,
  Sun,
  Shield,
  Home,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useWizardStore, BuildingStyle, WizardRoomItem } from '@/lib/stores/wizardStore';
import { useLanguage } from '@/context/LanguageContext';
import { FloorPlanLayout } from '@/lib/svg-generator';

interface ProjectSetupWizardModalProps {
  projectId?: string;
  onComplete?: (layout: FloorPlanLayout, svg: string) => void;
}

export default function ProjectSetupWizardModal({
  projectId,
  onComplete,
}: ProjectSetupWizardModalProps) {
  const { language } = useLanguage();
  const isTr = language === 'tr';

  const {
    isOpen,
    step,
    closeWizard,
    setStep,
    nextStep,
    prevStep,
    lotWidth,
    lotDepth,
    northOrientation,
    targetArea,
    floorsCount,
    hasBasement,
    hasAttic,
    buildingStyle,
    floorPrograms,
    isGenerating,
    error,
    setLotParams,
    setTypology,
    addRoomToFloor,
    removeRoomFromFloor,
    applyPresetProgram,
    setIsGenerating,
    setError,
  } = useWizardStore();

  const [activeTabLevel, setActiveTabLevel] = useState<number>(0);
  const [newRoomType, setNewRoomType] = useState<string>('bedroom');
  const [newRoomLabel, setNewRoomLabel] = useState<string>('');

  if (!isOpen) return null;

  // Compute calculated values
  const lotArea = lotWidth * lotDepth;
  const coverageRatio = ((targetArea / Math.max(1, floorsCount)) / lotArea) * 100;

  // Room type translation & choices
  const roomTypeOptions = [
    { value: 'living', label: isTr ? 'Salon / Yaşam Alanı' : 'Living Room' },
    { value: 'kitchen', label: isTr ? 'Mutfak / Ada Tezgah' : 'Kitchen' },
    { value: 'dining', label: isTr ? 'Yemek Alanı' : 'Dining Room' },
    { value: 'bedroom', label: isTr ? 'Yatak Odası' : 'Bedroom' },
    { value: 'bathroom', label: isTr ? 'Banyo / WC' : 'Bathroom / WC' },
    { value: 'hallway', label: isTr ? 'Antre / Hol / Sirkülasyon' : 'Hallway / Foyer' },
    { value: 'office', label: isTr ? 'Çalışma Odası / Ofis' : 'Home Office / Study' },
    { value: 'staircase', label: isTr ? 'Merdiven Kovası' : 'Staircase' },
    { value: 'void', label: isTr ? 'Galeri Boşluğu (Void)' : 'Gallery Void' },
    { value: 'shaft', label: isTr ? 'Tesisat Şaftı' : 'Plumbing Shaft' },
    { value: 'balcony', label: isTr ? 'Balkon / Teras / Veranda' : 'Balcony / Terrace' },
    { value: 'storage', label: isTr ? 'Kiler / Depo' : 'Storage / Pantry' },
    { value: 'laundry', label: isTr ? 'Çamaşır Odası' : 'Laundry Room' },
    { value: 'garage', label: isTr ? 'Kapalı Otopark / Garaj' : 'Garage' },
  ];

  async function handleFinishAndGenerate() {
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/wizard-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: projectId !== 'new' ? projectId : undefined,
          lotWidth,
          lotDepth,
          northOrientation,
          targetArea,
          floorsCount,
          hasBasement,
          hasAttic,
          buildingStyle,
          floorPrograms,
          language: isTr ? 'tr' : 'en',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isTr ? 'Plan üretilirken bir hata oluştu' : 'Failed to generate plan'));
      }

      if (onComplete && data.layout && data.svg) {
        onComplete(data.layout, data.svg);
      }
      closeWizard();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsGenerating(false);
    }
  }

  function handleAddCustomRoom(level: number) {
    const label = newRoomLabel.trim() || (roomTypeOptions.find((o) => o.value === newRoomType)?.label ?? 'Oda');
    addRoomToFloor(level, {
      type: newRoomType,
      label,
      targetArea: 15,
    });
    setNewRoomLabel('');
  }

  const currentTabProgram = floorPrograms.find((fp) => fp.level === activeTabLevel) || floorPrograms[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {isTr ? 'Proje Kurulum Sihirbazı' : 'Project Setup Wizard'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {isTr
                  ? 'Parametrik Arsa, Tipoloji ve Zonlama Tabanlı Çok Katlı Plan Üretimi'
                  : 'Parametric Lot, Typology & Multi-Floor Zoning Generator'}
              </p>
            </div>
          </div>

          <button
            onClick={closeWizard}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Navigation */}
        <div className="px-6 py-3 border-b border-slate-100 bg-white grid grid-cols-4 gap-2">
          {[
            { stepNum: 1, title: isTr ? '1. Arsa & Alan' : '1. Lot & Area' },
            { stepNum: 2, title: isTr ? '2. Kat & Tipoloji' : '2. Floors & Style' },
            { stepNum: 3, title: isTr ? '3. İhtiyaç Programı' : '3. Room Program' },
            { stepNum: 4, title: isTr ? '4. Üretim & Onay' : '4. Preview & Build' },
          ].map((item) => {
            const isActive = step === item.stepNum;
            const isCompleted = step > item.stepNum;
            return (
              <button
                key={item.stepNum}
                onClick={() => setStep(item.stepNum)}
                className={`flex items-center gap-2 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all text-left ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/30'
                    : isCompleted
                    ? 'text-slate-700 hover:bg-slate-100'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isActive
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-200'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : item.stepNum}
                </div>
                <span className="truncate">{item.title}</span>
              </button>
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Wizard Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ══════════════════════════════════════════════════════════════════
              ADIM 1: ARSA & TEMEL PARAMETRELER
             ══════════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Dimension Controls */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Maximize2 className="w-4 h-4 text-emerald-600" />
                    {isTr ? 'Arsa Boyutları & İmar Kotası' : 'Lot Dimensions & Site Metrics'}
                  </h3>

                  {/* Lot Width */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{isTr ? 'Arsa Cephe Eni (Metre)' : 'Lot Width (Frontage)'}</span>
                      <span className="text-emerald-700 font-bold text-sm">{lotWidth} m</span>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={50}
                      step={1}
                      value={lotWidth}
                      onChange={(e) => setLotParams({ lotWidth: Number(e.target.value) })}
                      className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>12 m</span>
                      <span>30 m</span>
                      <span>50 m</span>
                    </div>
                  </div>

                  {/* Lot Depth */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{isTr ? 'Arsa Derinliği (Metre)' : 'Lot Depth (Length)'}</span>
                      <span className="text-emerald-700 font-bold text-sm">{lotDepth} m</span>
                    </div>
                    <input
                      type="range"
                      min={15}
                      max={60}
                      step={1}
                      value={lotDepth}
                      onChange={(e) => setLotParams({ lotDepth: Number(e.target.value) })}
                      className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>15 m</span>
                      <span>35 m</span>
                      <span>60 m</span>
                    </div>
                  </div>

                  {/* Target Total Area */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{isTr ? 'Hedef Toplam İnşaat Alanı (m²)' : 'Target Construction Area (m²)'}</span>
                      <span className="text-emerald-700 font-bold text-sm">{targetArea} m²</span>
                    </div>
                    <input
                      type="range"
                      min={80}
                      max={500}
                      step={10}
                      value={targetArea}
                      onChange={(e) => setLotParams({ targetArea: Number(e.target.value) })}
                      className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>80 m²</span>
                      <span>250 m²</span>
                      <span>500 m²</span>
                    </div>
                  </div>
                </div>

                {/* Right: Compass Dial & Site Preview */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Compass className="w-4 h-4 text-emerald-600" />
                    {isTr ? 'Kuzey Yönlenmesi & Parsel Şeması' : 'North Orientation & Lot View'}
                  </h3>

                  {/* Interactive Compass */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col items-center text-center space-y-3">
                    <p className="text-xs text-slate-600">
                      {isTr
                        ? 'Güneş ışığı ve gece/gündüz zonlaması için parselin kuzey açısını belirleyin:'
                        : 'Adjust the solar north orientation for optimal zoning:'}
                    </p>

                    {/* Compass Dial Widget */}
                    <div className="relative w-36 h-36 rounded-full border-4 border-slate-200 bg-white shadow-inner flex items-center justify-center">
                      {/* Cardinal Directions */}
                      <span className="absolute top-1 text-[11px] font-black text-rose-600">K / N</span>
                      <span className="absolute bottom-1 text-[10px] font-bold text-slate-400">G / S</span>
                      <span className="absolute right-2 text-[10px] font-bold text-slate-400">D / E</span>
                      <span className="absolute left-2 text-[10px] font-bold text-slate-400">B / W</span>

                      {/* Rotating Compass Needle */}
                      <div
                        className="w-full h-full flex items-center justify-center transition-transform duration-150 pointer-events-none"
                        style={{ transform: `rotate(${northOrientation}deg)` }}
                      >
                        <div className="w-1.5 h-16 bg-gradient-to-t from-slate-400 via-rose-500 to-rose-600 rounded-full shadow-sm transform -translate-y-2" />
                      </div>

                      {/* Center pin */}
                      <div className="absolute w-4 h-4 bg-slate-900 rounded-full border-2 border-white shadow" />
                    </div>

                    {/* Degree Slider */}
                    <div className="w-full space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{isTr ? 'Açı Derecesi' : 'Heading'}</span>
                        <span className="font-mono text-emerald-700 font-bold">{northOrientation}°</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={355}
                        step={5}
                        value={northOrientation}
                        onChange={(e) => setLotParams({ northOrientation: Number(e.target.value) })}
                        className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Summary Metric Pill */}
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
                      <span className="text-[10px] font-semibold text-emerald-800 uppercase block">
                        {isTr ? 'Arsa Alanı' : 'Lot Area'}
                      </span>
                      <span className="text-base font-black text-emerald-700">{lotArea} m²</span>
                    </div>
                    <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
                      <span className="text-[10px] font-semibold text-emerald-800 uppercase block">
                        {isTr ? 'Tahmini TAKS Oturumu' : 'Ground Coverage'}
                      </span>
                      <span className="text-base font-black text-emerald-700">%{coverageRatio.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              ADIM 2: KAT SAYISI VE TİPOLOJİ
             ══════════════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in">
              {/* Floors Count Selection */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
                  {isTr ? 'Kat Sayısı & Düşey Kurgu' : 'Storeys & Vertical Organization'}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { count: 1, label: isTr ? 'Tek Katlı' : 'Single Storey', desc: isTr ? 'Geniş yatay zemin yerleşimi, terasla bütünleşik' : 'Spacious single floor bungalow' },
                    { count: 2, label: isTr ? 'Dubleks (2 Kat)' : 'Duplex (2 Storeys)', desc: isTr ? 'Zemin yaşam, üst kat ebeveyn ve çocuk odaları' : 'Ground day zone, upper night suites' },
                    { count: 3, label: isTr ? 'Tripleks (3 Kat)' : 'Triplex (3 Storeys)', desc: isTr ? 'Zemin salon, 1. kat odalar, 2. kat lounge & teras' : 'Living, suites, and penthouse lounge' },
                  ].map((item) => (
                    <button
                      key={item.count}
                      onClick={() => setTypology({ floorsCount: item.count as 1 | 2 | 3 })}
                      className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                        floorsCount === item.count
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-md ring-1 ring-emerald-600/30'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      {floorsCount === item.count && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                      <div className="font-bold text-sm text-slate-900 mb-1">{item.label}</div>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Basement & Attic Toggles */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
                  {isTr ? 'Ek Seviyeler & Opsiyonlar' : 'Optional Additional Levels'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Basement Toggle */}
                  <div
                    onClick={() => setTypology({ hasBasement: !hasBasement })}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                      hasBasement
                        ? 'border-emerald-600 bg-emerald-50/50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${hasBasement ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{isTr ? 'Bodrum Katı Ekle' : 'Include Basement'}</div>
                        <div className="text-[11px] text-slate-500">{isTr ? 'Mekanik oda, depo, sığınak & hobi' : 'Mechanical room, storage & gym'}</div>
                      </div>
                    </div>
                    <input type="checkbox" checked={hasBasement} readOnly className="accent-emerald-600 w-4 h-4 rounded" />
                  </div>

                  {/* Attic Toggle */}
                  <div
                    onClick={() => setTypology({ hasAttic: !hasAttic })}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                      hasAttic
                        ? 'border-emerald-600 bg-emerald-50/50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${hasAttic ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Sun className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{isTr ? 'Çatı Katı / Güneşlenme Terası' : 'Include Attic / Roof Terrace'}</div>
                        <div className="text-[11px] text-slate-500">{isTr ? 'Panoramik teras, çatı lounge & bar' : 'Panoramic sun terrace & rooftop bar'}</div>
                      </div>
                    </div>
                    <input type="checkbox" checked={hasAttic} readOnly className="accent-emerald-600 w-4 h-4 rounded" />
                  </div>
                </div>
              </div>

              {/* Building Style Selection */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
                  {isTr ? 'Mimari Tipoloji & Kütle Dili' : 'Architectural Style & Massing'}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      style: 'modern',
                      title: isTr ? 'Modern / Minimalist' : 'Modern / Minimalist',
                      badge: isTr ? 'Açık Plan & Konsol' : 'Open-Plan',
                      desc: isTr ? 'Geniş cam cepheler, brüt beton, konsol saçaklar ve açık mekan ilişkileri' : 'Floor-to-ceiling glass, cantilevered roofs, fluid spaces',
                    },
                    {
                      style: 'courtyard',
                      title: isTr ? 'Avlulu / Courtyard' : 'Courtyard / Atrium',
                      badge: isTr ? 'İç Bahçe & Mikroklima' : 'Microclimate',
                      desc: isTr ? 'Merkezi iç avluya açılan mahrem odalar, doğal havalandırma ve su öğesi' : 'Centred around a private inner patio with natural light',
                    },
                    {
                      style: 'pavilion',
                      title: isTr ? 'Parçalı / Pavilion' : 'Pavilion / Winged',
                      badge: isTr ? 'Doğayla Bütünleşik' : 'Organic',
                      desc: isTr ? 'Ayrı kanatlara bölünmüş kütleler, kademeli teraslar ve manzaraya açılan akslar' : 'Separated living and sleeping wings connected by glazed corridors',
                    },
                  ].map((s) => (
                    <button
                      key={s.style}
                      onClick={() => setTypology({ buildingStyle: s.style as BuildingStyle })}
                      className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                        buildingStyle === s.style
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-md ring-1 ring-emerald-600/30'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      {buildingStyle === s.style && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-700 mb-2">
                        {s.badge}
                      </span>
                      <div className="font-bold text-sm text-slate-900 mb-1">{s.title}</div>
                      <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              ADIM 3: İHTİYAÇ PROGRAMI (KAT BAZLI ZONLAMA)
             ══════════════════════════════════════════════════════════════════ */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    {isTr ? 'Kat Bazlı Mekân Dağılımı' : 'Floor-by-Floor Space Allocation'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isTr
                      ? 'Her katın fonksiyon programını inceleyin, yeni oda ekleyin veya kaldırın:'
                      : 'Customize rooms and functional spaces per floor level:'}
                  </p>
                </div>

                <button
                  onClick={() => applyPresetProgram(floorsCount, hasBasement, hasAttic)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  {isTr ? 'Önerilen Programı Sıfırla' : 'Reset to Recommended'}
                </button>
              </div>

              {/* Floor Tabs */}
              <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
                {floorPrograms.map((fp) => {
                  const isActive = (activeTabLevel === fp.level) || (!floorPrograms.some(f => f.level === activeTabLevel) && fp.level === floorPrograms[0].level);
                  return (
                    <button
                      key={fp.level}
                      onClick={() => setActiveTabLevel(fp.level)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                      }`}
                    >
                      <Building className="w-3.5 h-3.5" />
                      <span>{fp.name}</span>
                      <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${isActive ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 text-slate-500'}`}>
                        {fp.rooms.length} {isTr ? 'oda' : 'rooms'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Floor Content */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-700">
                    {currentTabProgram?.name} — {isTr ? 'Oda Listesi' : 'Room Roster'}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Kot: {currentTabProgram?.elevation >= 0 ? `+${currentTabProgram.elevation.toFixed(1)}` : currentTabProgram.elevation.toFixed(1)}m
                  </span>
                </div>

                {/* Rooms Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {currentTabProgram?.rooms.map((room) => {
                    const isCore = room.type === 'staircase' || room.type === 'shaft';
                    return (
                      <div
                        key={room.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                          isCore
                            ? 'bg-amber-50/70 border-amber-200 text-amber-900 font-semibold'
                            : room.type === 'void'
                            ? 'bg-sky-50 border-sky-200 text-sky-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                          <span className="truncate">{room.label}</span>
                        </div>

                        {!isCore ? (
                          <button
                            onClick={() => removeRoomFromFloor(currentTabProgram.level, room.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title={isTr ? 'Odayı Kaldır' : 'Remove Room'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-amber-700 font-bold px-1 rounded bg-amber-100/60">
                            {isTr ? 'Kilitli Aks' : 'Locked Core'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add Custom Room Row */}
                <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row gap-2">
                  <select
                    value={newRoomType}
                    onChange={(e) => setNewRoomType(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-700"
                  >
                    {roomTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder={isTr ? 'Oda Özel İsmi (opsiyonel)' : 'Custom Room Label (optional)'}
                    value={newRoomLabel}
                    onChange={(e) => setNewRoomLabel(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                  />

                  <button
                    onClick={() => handleAddCustomRoom(currentTabProgram.level)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isTr ? 'Oda Ekle' : 'Add Room'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              ADIM 4: TASARIM ÖNİZLEME & ÜRETİM ONAYI
             ══════════════════════════════════════════════════════════════════ */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="text-center max-w-md mx-auto space-y-2">
                <div className="w-12 h-12 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {isTr ? 'Parametrik Model Üretime Hazır' : 'Model Ready for Multi-Floor Generation'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isTr
                    ? 'Aşağıdaki mimari parametrelere göre aks hizalı, düşey sirkülasyon kilitli ve ghost trace katmanlı planlar üretilecek.'
                    : 'A coherent multi-floor BIM layout will be compiled with aligned staircase cores, locked shafts, and ghost trace overlays.'}
                </p>
              </div>

              {/* Architectural Passport / Summary Card */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {isTr ? 'Mimari Şartname Özeti' : 'Architectural Specification Summary'}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">{isTr ? 'Arsa Boyutu' : 'Lot Size'}</span>
                    <span className="text-sm font-black text-slate-800">{lotWidth} × {lotDepth} m</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">{isTr ? 'Kuzey Açısı' : 'North Axis'}</span>
                    <span className="text-sm font-black text-slate-800">{northOrientation}°</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">{isTr ? 'Hedef Alan' : 'Target Area'}</span>
                    <span className="text-sm font-black text-emerald-700">{targetArea} m²</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">{isTr ? 'Kat Kurgusu' : 'Floors'}</span>
                    <span className="text-sm font-black text-slate-800">
                      {floorsCount} Kat {hasBasement ? '+ Bodrum' : ''} {hasAttic ? '+ Çatı' : ''}
                    </span>
                  </div>
                </div>

                {/* Floor-by-floor breakdown */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <span className="text-xs font-semibold text-slate-700 block">
                    {isTr ? 'Kat Seviyeleri ve Mekânlar:' : 'Levels & Allocated Zones:'}
                  </span>
                  <div className="space-y-1.5">
                    {floorPrograms.map((fp) => (
                      <div key={fp.level} className="flex items-center justify-between text-xs p-2 bg-white rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{fp.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono">({fp.elevation >= 0 ? `+${fp.elevation.toFixed(1)}` : fp.elevation.toFixed(1)}m)</span>
                        </div>
                        <span className="text-slate-500 font-medium text-[11px] truncate max-w-xs text-right">
                          {fp.rooms.map((r) => r.label).join(', ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Prev / Next / Generate Buttons */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/70">
          <div>
            {step > 1 ? (
              <button
                onClick={prevStep}
                disabled={isGenerating}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{isTr ? 'Geri' : 'Back'}</span>
              </button>
            ) : (
              <button
                onClick={closeWizard}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
              >
                {isTr ? 'İptal' : 'Cancel'}
              </button>
            )}
          </div>

          <div>
            {step < 4 ? (
              <button
                onClick={nextStep}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md active:scale-95"
              >
                <span>{isTr ? 'Devam Et' : 'Continue'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleFinishAndGenerate}
                disabled={isGenerating}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isTr ? 'Planlar ve Akslar Üretiliyor...' : 'Generating Multi-Floor Plan...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{isTr ? 'Planları Üret & Editöre Aktar' : 'Generate Plans & Open in Editor'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
