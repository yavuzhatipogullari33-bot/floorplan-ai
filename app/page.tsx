'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Sparkles,
  MessageSquare,
  Download,
  Home,
  Zap,
  Shield,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';

export default function LandingPage() {
  const { t, language } = useLanguage();

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Home className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-gray-900">FloorPlan AI</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                {t.nav.howItWorks}
              </a>
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                {t.nav.features}
              </a>
              <a href="#testimonials" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                {t.nav.reviews}
              </a>
            </div>

            <div className="flex items-center gap-3">
              {/* Language Selector in Header */}
              <LanguageSelector />

              <Link href="/sign-in" className="btn-secondary text-sm hidden sm:inline-flex">
                {t.nav.signIn}
              </Link>
              <Link href="/dashboard" className="btn-primary text-sm">
                {t.nav.getStarted}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-24">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-blue-50 -z-10" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-green-200/20 rounded-full blur-3xl -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-xs text-green-700 font-medium mb-6">
            <Sparkles className="w-3 h-3 text-green-600" />
            {t.hero.badge}
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-gray-900 leading-tight mb-6">
            {t.hero.title1}{' '}
            <span className="text-green-600">{t.hero.title2}</span>{' '}
            {t.hero.title3}
          </h1>

          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-8">
            {t.hero.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link href="/dashboard" className="btn-primary px-8 py-3.5 text-base shadow-lg shadow-green-600/20">
              {t.hero.ctaPrimary}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#how-it-works" className="btn-secondary px-8 py-3.5 text-base">
              {t.hero.ctaSecondary}
            </a>
          </div>

          {/* Value Badges */}
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-gray-500 mb-16">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              {t.hero.noCreditCard}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              {t.hero.freeToUse}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              {t.hero.exportFormats}
            </span>
          </div>

          {/* Demo floor plan preview */}
          <div className="relative max-w-4xl mx-auto">
            <div className="card overflow-hidden shadow-2xl border-gray-200">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="ml-3 text-xs text-gray-500 font-mono font-medium">
                    FloorPlan AI — {t.hero.demoTitle}
                  </span>
                </div>
                <span className="text-[11px] text-gray-400 font-mono hidden sm:inline">
                  {t.hero.demoSubtitle}
                </span>
              </div>

              {/* Mock floor plan SVG */}
              <div className="p-6 bg-[#FAFAFA]">
                <svg viewBox="0 0 700 420" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                  {/* Grid */}
                  {Array.from({ length: 12 }, (_, i) => (
                    <line key={`vg-${i}`} x1={40 + i * 55} y1="20" x2={40 + i * 55} y2="400" stroke="#E5E7EB" strokeWidth="0.5" />
                  ))}
                  {Array.from({ length: 8 }, (_, i) => (
                    <line key={`hg-${i}`} x1="40" y1={20 + i * 55} x2="660" y2={20 + i * 55} stroke="#E5E7EB" strokeWidth="0.5" />
                  ))}

                  {/* Living Room */}
                  <rect x="40" y="20" width="220" height="165" fill="#F0FDF4" stroke="#16A34A" strokeWidth="2.5" rx="2" />
                  <text x="150" y="98" textAnchor="middle" fontFamily="Inter, system-ui" fontSize="12" fontWeight="600" fill="#16A34A">
                    {language === 'tr' ? 'Oturma Odası' : 'Living Room'}
                  </text>
                  <text x="150" y="114" textAnchor="middle" fontFamily="Inter, system-ui" fontSize="9" fill="#9CA3AF">28.5 m²</text>

                  {/* Kitchen */}
                  <rect x="260" y="20" width="165" height="110" fill="#FFF7ED" stroke="#EA580C" strokeWidth="2.5" rx="2" />
                  <text x="342" y="73" textAnchor="middle" fontFamily="Inter, system-ui" fontSize="12" fontWeight="600" fill="#EA580C">
                    {language === 'tr' ? 'Mutfak' : 'Kitchen'}
                  </text>
                  <text x="342" y="88" textAnchor="middle" fontFamily="Inter, system-ui" fontSize="9" fill="#9CA3AF">16.2 m²</text>

                  {/* Dining */}
                  <rect x="425" y="20" width="165" height="110" fill="#FFFBEB" stroke="#D97706" strokeWidth="2.5" rx="2" />
                  <text x="507" y="73" textAnchor="middle" fontFamily="Inter, system-ui" fontSize="12" fontWeight="600" fill="#D97706">
                    {language === 'tr' ? 'Yemek Alanı' : 'Dining'}
                  </text>
                  <text x="507" y="88" textAnchor="middle" fontFamily="Inter, system-ui" fontSize="9" fill="#9CA3AF">14.8 m²</text>

                  {/* Hallway */}
                  <rect x="260" y="130" width="330" height="55" fill="#F9FAFB" stroke="#6B7280" strokeWidth="2.5" rx="2" />
                  <text x="425" y="162" textAnchor="middle" fontFamily="Inter, system-ui" fontSize="11" fontWeight="600" fill="#6B7280">
                    {language === 'tr' ? 'Koridor' : 'Hallway'}
                  </text>

                  {/* Master Bedroom */}
                  <rect x="40" y="185" width="220" height="165" fill="#EFF6FF" stroke="#2563EB" strokeWidth="2.5" rx="2" />
                  <text x="150" y="263" textAnchor="middle" fontFamily="Inter, system-ui" fontSize="12" fontWeight="600" fill="#2563EB">
                    {language === 'tr' ? 'Ebeveyn Yatak Odası' : 'Master Bedroom'}
                  </text>
                  <text x="150" y="278" textAnchor="middle" fontFamily="Inter, system-ui" fontSize="9" fill="#9CA3AF">25.4 m²</text>

                  {/* Bedroom 2 */}
                  <rect x="260" y="185" width="165" height="165" fill="#EFF6FF" stroke="#2563EB" strokeWidth="2.5" rx="2" />
                  <text x="342" y="263" textAnchor="middle" fontFamily="Inter, system-ui" fontSize="12" fontWeight="600" fill="#2563EB">
                    {language === 'tr' ? 'Yatak Odası 2' : 'Bedroom 2'}
                  </text>
                  <text x="342" y="278" textAnchor="middle" fontFamily="Inter, system-ui" fontSize="9" fill="#9CA3AF">18.7 m²</text>

                  {/* Bathroom */}
                  <rect x="425" y="185" width="110" height="110" fill="#F0F9FF" stroke="#0284C7" strokeWidth="2.5" rx="2" />
                  <text x="480" y="235" textAnchor="middle" fontFamily="Inter, system-ui" fontSize="11" fontWeight="600" fill="#0284C7">
                    {language === 'tr' ? 'Banyo' : 'Bathroom'}
                  </text>
                  <text x="480" y="250" textAnchor="middle" fontFamily="Inter, system-ui" fontSize="9" fill="#9CA3AF">8.5 m²</text>

                  {/* Bedroom 3 */}
                  <rect x="535" y="185" width="110" height="165" fill="#EFF6FF" stroke="#2563EB" strokeWidth="2.5" rx="2" />
                  <text x="590" y="263" textAnchor="middle" fontFamily="Inter, system-ui" fontSize="11" fontWeight="600" fill="#2563EB">
                    {language === 'tr' ? 'Yatak Odası 3' : 'Bedroom 3'}
                  </text>
                  <text x="590" y="278" textAnchor="middle" fontFamily="Inter, system-ui" fontSize="9" fill="#9CA3AF">12.3 m²</text>

                  {/* Laundry */}
                  <rect x="425" y="295" width="110" height="55" fill="#FFF1F2" stroke="#E11D48" strokeWidth="2.5" rx="2" />
                  <text x="480" y="326" textAnchor="middle" fontFamily="Inter, system-ui" fontSize="10" fontWeight="600" fill="#E11D48">
                    {language === 'tr' ? 'Çamaşır Odası' : 'Laundry'}
                  </text>

                  {/* Compass */}
                  <text x="650" y="400" textAnchor="middle" fontFamily="Inter, system-ui" fontSize="11" fontWeight="bold" fill="#374151">N</text>
                  <line x1="650" y1="395" x2="650" y2="380" stroke="#374151" strokeWidth="1.5" />

                  {/* Scale */}
                  <line x1="40" y1="410" x2="95" y2="410" stroke="#6B7280" strokeWidth="1.5" />
                  <line x1="40" y1="406" x2="40" y2="414" stroke="#6B7280" strokeWidth="1.5" />
                  <line x1="95" y1="406" x2="95" y2="414" stroke="#6B7280" strokeWidth="1.5" />
                  <text x="67" y="404" textAnchor="middle" fontFamily="Inter, system-ui" fontSize="8" fill="#6B7280">3m</text>
                </svg>
              </div>
            </div>

            {/* Floating chat bubble */}
            <div className="absolute -right-6 top-20 hidden lg:flex items-start gap-2 bg-white rounded-xl shadow-lg border border-gray-100 p-3 max-w-xs animate-fade-in text-left">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">AI Assistant</p>
                <p className="text-sm text-gray-800">
                  {language === 'tr'
                    ? '2. yatak odasının yanına bir banyo ekledim ve mutfak adasını merkeze aldım! ✨'
                    : "I've added a bathroom next to bedroom 2 and centered the kitchen island! ✨"}
                </p>
              </div>
            </div>

            {/* Floating prompt */}
            <div className="absolute -left-6 bottom-20 hidden lg:flex items-center gap-2 bg-white rounded-xl shadow-lg border border-gray-100 p-3 max-w-xs animate-slide-up text-left">
              <MessageSquare className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-sm text-gray-700 italic">
                {language === 'tr'
                  ? '"Ebeveyn odasını büyüt ve giyinme odası ekle"'
                  : '"Make the master bedroom bigger and add a walk-in closet"'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: t.stats.stat1Val, label: t.stats.stat1Label },
              { value: t.stats.stat2Val, label: t.stats.stat2Label },
              { value: t.stats.stat3Val, label: t.stats.stat3Label },
              { value: t.stats.stat4Val, label: t.stats.stat4Label },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full mb-3">
              {t.howItWorks.badge}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{t.howItWorks.title}</h2>
            <p className="text-base sm:text-lg text-gray-500 max-w-xl mx-auto">
              {t.howItWorks.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: t.howItWorks.step1Num,
                icon: <MessageSquare className="w-6 h-6 text-green-600" />,
                title: t.howItWorks.step1Title,
                description: t.howItWorks.step1Desc,
                color: 'bg-green-50 border-green-200',
              },
              {
                step: t.howItWorks.step2Num,
                icon: <Sparkles className="w-6 h-6 text-blue-600" />,
                title: t.howItWorks.step2Title,
                description: t.howItWorks.step2Desc,
                color: 'bg-blue-50 border-blue-200',
              },
              {
                step: t.howItWorks.step3Num,
                icon: <Download className="w-6 h-6 text-purple-600" />,
                title: t.howItWorks.step3Title,
                description: t.howItWorks.step3Desc,
                color: 'bg-purple-50 border-purple-200',
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className={`card p-6 border ${item.color} h-full`}>
                  <div className="text-5xl font-black text-gray-200 mb-4">{item.step}</div>
                  <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center mb-4">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full mb-3">
              {t.features.badge}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t.features.title}
            </h2>
            <p className="text-base sm:text-lg text-gray-500 max-w-xl mx-auto">
              {t.features.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap className="w-5 h-5 text-yellow-500" />,
                title: t.features.f1Title,
                description: t.features.f1Desc,
              },
              {
                icon: <MessageSquare className="w-5 h-5 text-green-500" />,
                title: t.features.f2Title,
                description: t.features.f2Desc,
              },
              {
                icon: <Download className="w-5 h-5 text-blue-500" />,
                title: t.features.f3Title,
                description: t.features.f3Desc,
              },
              {
                icon: <Home className="w-5 h-5 text-purple-500" />,
                title: t.features.f4Title,
                description: t.features.f4Desc,
              },
              {
                icon: <Shield className="w-5 h-5 text-red-500" />,
                title: t.features.f5Title,
                description: t.features.f5Desc,
              },
              {
                icon: <Sparkles className="w-5 h-5 text-emerald-500" />,
                title: t.features.f6Title,
                description: t.features.f6Desc,
              },
            ].map((feature) => (
              <div key={feature.title} className="card p-6 hover:shadow-md transition-shadow bg-white">
                <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full mb-3">
              {t.testimonials.badge}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{t.testimonials.title}</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: t.testimonials.t1Author,
                role: t.testimonials.t1Role,
                text: t.testimonials.t1Text,
                rating: 5,
              },
              {
                name: t.testimonials.t2Author,
                role: t.testimonials.t2Role,
                text: t.testimonials.t2Text,
                rating: 5,
              },
              {
                name: t.testimonials.t3Author,
                role: t.testimonials.t3Role,
                text: t.testimonials.t3Text,
                rating: 5,
              },
            ].map((testim, i) => (
              <div key={i} className="card p-6 bg-white border border-gray-100">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: testim.rating }, (_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">&ldquo;{testim.text}&rdquo;</p>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{testim.name}</div>
                  <div className="text-gray-400 text-xs">{testim.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-green-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {t.cta.title}
          </h2>
          <p className="text-green-100 text-base sm:text-lg mb-8">
            {t.cta.subtitle}
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-green-700 font-bold rounded-xl hover:bg-green-50 transition-all text-base shadow-xl active:scale-95"
          >
            {t.cta.button}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-600 rounded-md flex items-center justify-center">
              <Home className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-900">FloorPlan AI</span>
            <span className="text-xs text-gray-400 ml-2 hidden sm:inline">{t.footer.tagline}</span>
          </div>

          <div className="flex items-center gap-6">
            <LanguageSelector />
            <p className="text-xs text-gray-400">© 2026 FloorPlan AI. {t.footer.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
