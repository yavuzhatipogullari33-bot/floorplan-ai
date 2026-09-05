'use client';

export const dynamic = 'force-dynamic';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus,
  Home,
  Clock,
  Trash2,
  LogOut,
  Sparkles,
  ArrowRight,
  LayoutDashboard,
  Users,
  ShieldCheck,
  X,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { formatDate } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';

interface Project {
  id: string;
  name: string;
  description: string | null;
  style: string;
  bedrooms: number;
  bathrooms: number;
  totalArea: number;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
}

interface RegisteredUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image: string | null;
  createdAt: string;
  _count: { projects: number };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, language } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Admin users modal state
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [usersList, setUsersList] = useState<RegisteredUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProjects();
    }
  }, [status]);

  async function fetchProjects() {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data.projects ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function fetchRegisteredUsers() {
    setLoadingUsers(true);
    setShowUsersModal(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsersList(data.users ?? []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function createProject() {
    setCreating(true);
    try {
      const defaultName = language === 'tr' ? 'Yeni Kat Planı' : 'New Floor Plan';
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: defaultName }),
      });
      const data = await res.json();
      router.push(`/editor/${data.project.id}`);
    } catch {
      setCreating(false);
    }
  }

  async function deleteProject(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(t.dashboard.deleteConfirm)) return;
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 text-gray-400">
          <div className="w-4 h-4 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
          {t.dashboard.loading}
        </div>
      </div>
    );
  }

  const isAdmin =
    session?.user?.email === 'yavuzhatipogullari33@gmail.com' ||
    (session?.user as any)?.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 h-screen sticky top-0">
        {/* Logo */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-emerald-600 group-hover:bg-emerald-700 transition-colors rounded-xl flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 tracking-tight">FloorPlan AI</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-semibold">
            <LayoutDashboard className="w-4 h-4" />
            {t.nav.dashboard}
          </div>

          {/* Admin Registered Users Button */}
          {isAdmin && (
            <button
              onClick={fetchRegisteredUsers}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 text-sm font-medium transition-colors"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>{language === 'tr' ? 'Kayıtlı Üyeler' : 'Registered Users'}</span>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                Admin
              </span>
            </button>
          )}
        </nav>

        {/* User Profile */}
        <div className="p-3 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2.5 mb-2.5">
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt="Avatar"
                width={36}
                height={36}
                className="w-9 h-9 rounded-full border border-gray-200"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 text-sm">
                {session?.user?.name?.[0] || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-xs font-semibold text-gray-900 truncate">{session?.user?.name}</p>
                {isAdmin && (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded border border-amber-300">
                    {t.dashboard.adminBadge}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 truncate">{session?.user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            {t.dashboard.signOut}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 md:p-10 overflow-y-auto">
        {/* Top Header with Language Selector & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t.dashboard.title}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {t.dashboard.projectCount(projects.length)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSelector />

            <button
              onClick={createProject}
              disabled={creating}
              className="btn-primary flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              {creating ? t.dashboard.creating : t.dashboard.newProject}
            </button>
          </div>
        </div>

        {/* Quick start if no projects */}
        {projects.length === 0 && !loading && (
          <div className="card p-12 text-center border-dashed border-2 border-gray-200 bg-white rounded-3xl">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t.dashboard.emptyTitle}
            </h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              {t.dashboard.emptySubtitle}
            </p>
            <button
              onClick={createProject}
              disabled={creating}
              className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md"
            >
              <Plus className="w-4 h-4" />
              {t.dashboard.createFirstBtn}
            </button>
          </div>
        )}

        {/* Project grid */}
        {projects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="card group hover:shadow-xl transition-all duration-200 bg-white rounded-2xl border border-gray-200/80 overflow-hidden flex flex-col justify-between"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-bold text-gray-900 text-base line-clamp-1 group-hover:text-emerald-600 transition-colors">
                      {project.name}
                    </h3>
                    <button
                      onClick={(e) => deleteProject(project.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {project.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-4">
                      {project.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs text-gray-600 mb-4">
                    <span className="bg-gray-100 px-2.5 py-1 rounded-lg font-medium">
                      {project.bedrooms} {language === 'tr' ? 'Yatak Odası' : 'Bedrooms'}
                    </span>
                    <span className="bg-gray-100 px-2.5 py-1 rounded-lg font-medium">
                      {project.bathrooms} {language === 'tr' ? 'Banyo' : 'Baths'}
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-lg">
                      {project.totalArea} m²
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDate(project.updatedAt)}</span>
                  </div>

                  <Link
                    href={`/editor/${project.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>{t.dashboard.openEditor}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Registered Users Modal */}
      {showUsersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    {language === 'tr' ? 'Kayıtlı Üyeler Listesi' : 'Registered Users List'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {language === 'tr'
                      ? `Sisteme kayıtlı toplam ${usersList.length} kullanıcı bulunuyor.`
                      : `Total ${usersList.length} users registered on the platform.`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUsersModal(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Users Table */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingUsers ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
                  <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-medium">Yükleniyor...</span>
                </div>
              ) : usersList.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  Henüz kayıtlı üye bulunamadı.
                </div>
              ) : (
                <div className="space-y-3">
                  {usersList.map((usr) => (
                    <div
                      key={usr.id}
                      className="flex items-center justify-between p-3.5 bg-gray-50 hover:bg-emerald-50/40 border border-gray-200/80 rounded-2xl transition-all"
                    >
                      <div className="flex items-center gap-3">
                        {usr.image ? (
                          <Image
                            src={usr.image}
                            alt="User"
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full border border-gray-200 bg-white"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                            {usr.name?.[0] || 'U'}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900">{usr.name}</span>
                            {usr.role === 'admin' ? (
                              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300 inline-flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-amber-600" />
                                ADMIN
                              </span>
                            ) : (
                              <span className="bg-gray-200 text-gray-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
                                Üye
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{usr.email}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 inline-block mb-1">
                          {usr._count.projects} {language === 'tr' ? 'Plan Üretti' : 'Plans'}
                        </div>
                        <p className="text-[10px] text-gray-400">
                          {new Date(usr.createdAt).toLocaleDateString(
                            language === 'tr' ? 'tr-TR' : 'en-US',
                            {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowUsersModal(false)}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
