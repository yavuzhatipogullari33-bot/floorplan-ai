'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Home, ShieldCheck, Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2, LogOut } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';
import Link from 'next/link';

export default function SignInPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, language } = useLanguage();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Handle Standard Sign In
  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError(language === 'tr' ? 'Lütfen e-posta ve şifrenizi girin.' : 'Please enter email and password.');
      return;
    }

    setLoading(true);
    const result = await signIn('credentials', {
      email: email.trim(),
      password: password,
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else if (result?.ok) {
      router.push('/dashboard');
    }
  }

  // Handle Standard Sign Up
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError(language === 'tr' ? 'Lütfen tüm alanları doldurun.' : 'Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError(language === 'tr' ? 'Şifreniz en az 6 karakter olmalıdır.' : 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || email.split('@')[0],
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess(language === 'tr' ? 'Hesabınız oluşturuldu! Giriş yapılıyor...' : 'Account created! Signing you in...');

      // Auto sign in after register
      const loginRes = await signIn('credentials', {
        email: email.trim(),
        password: password,
        redirect: false,
      });

      if (loginRes?.ok) {
        router.push('/dashboard');
      } else {
        setMode('signin');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  // Google OAuth Login
  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);

    try {
      await signIn('google-oauth', {
        callbackUrl: '/dashboard',
        email: email || 'yavuzhatipogullari33@gmail.com',
      });
    } catch (err) {
      console.error('Google login error:', err);
    } finally {
      setLoading(false);
    }
  }

  // Quick Admin Login
  async function handleAdminQuickLogin() {
    setLoading(true);
    setError(null);
    const res = await signIn('credentials', {
      email: 'yavuzhatipogullari33@gmail.com',
      password: 'admin_master_password',
      redirect: false,
    });
    setLoading(false);
    router.push('/dashboard');
  }

  // Force Sign Out & Switch Account
  async function handleSignOutAndReset() {
    setLoading(true);
    await signOut({ redirect: false });
    setLoading(false);
    setError(null);
    setSuccess(language === 'tr' ? 'Oturum kapatıldı. Şimdi istediğiniz hesapla giriş yapabilirsiniz.' : 'Signed out. You can now sign in with any account.');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50 flex flex-col justify-between p-4 selection:bg-emerald-100">
      {/* Top Bar with Language Selector */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between py-2">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-emerald-600 group-hover:bg-emerald-700 transition-colors rounded-xl flex items-center justify-center shadow-md shadow-emerald-600/20">
            <Home className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm tracking-tight">FloorPlan AI</span>
        </Link>
        <LanguageSelector />
      </div>

      {/* Main Authentication Box */}
      <div className="w-full max-w-md mx-auto my-auto py-6">
        {/* Logo and Headings */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            {t.signIn.title}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            {t.signIn.subtitle}
          </p>
        </div>

        {/* Active Session Warning Bar (If already logged in) */}
        {status === 'authenticated' && session?.user && (
          <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm text-xs text-amber-900 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold">
                {language === 'tr' ? 'Şu An Açık Oturum:' : 'Currently Logged In:'}
              </span>
              <span className="bg-amber-200/80 px-2 py-0.5 rounded text-[10px] font-bold">
                {session.user.role === 'admin' ? '👑 ADMIN' : 'ÜYE'}
              </span>
            </div>
            <p className="font-semibold text-gray-800 mb-3 truncate">{session.user.email} ({session.user.name})</p>
            
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-center transition-colors shadow-xs"
              >
                {language === 'tr' ? 'Panele Git' : 'Go to Dashboard'}
              </Link>
              <button
                type="button"
                onClick={handleSignOutAndReset}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 font-bold rounded-xl transition-colors shadow-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{language === 'tr' ? 'Çıkış Yap' : 'Sign Out'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Card Container */}
        <div className="card p-6 sm:p-8 shadow-2xl border border-gray-200/80 bg-white/95 backdrop-blur-md rounded-3xl">
          {/* Sign In / Sign Up Mode Switcher Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-2xl mb-6 border border-gray-200/60">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                mode === 'signin'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.signIn.tabSignIn}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                mode === 'signup'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.signIn.tabSignUp}
            </button>
          </div>

          {/* Error & Success Alerts */}
          {error && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 animate-fade-in font-medium">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-start gap-2 animate-fade-in font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
            {/* Name Input (Only on Sign Up) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {t.signIn.nameLabel}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.signIn.namePlaceholder}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                {t.signIn.emailLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.signIn.emailPlaceholder}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                {t.signIn.passwordLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.signIn.passwordPlaceholder}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : mode === 'signin' ? (
                <>
                  <span>{t.signIn.signInBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>{t.signIn.signUpBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-3 text-gray-400 text-xs font-medium uppercase tracking-wider">
              {t.signIn.orDivider}
            </span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 shadow-xs transition-all active:scale-[0.98]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{t.signIn.continueWithGoogle}</span>
          </button>

          {/* Quick Admin Access Badge */}
          <div className="mt-5 pt-4 border-t border-gray-100 text-center">
            <button
              type="button"
              onClick={handleAdminQuickLogin}
              disabled={loading}
              className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200 active:scale-95"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>👑 {t.signIn.adminQuickLoginBadge}</span>
            </button>
          </div>
        </div>

        {/* Footer Notice */}
        <p className="text-center text-[11px] text-gray-400 mt-4 px-4">
          {t.signIn.termsNotice}
        </p>
      </div>

      <div className="w-full max-w-5xl mx-auto py-2 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} FloorPlan AI. {t.footer.copyright}
      </div>
    </div>
  );
}
