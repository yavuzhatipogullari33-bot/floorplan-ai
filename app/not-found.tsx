import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center font-bold text-2xl mb-4">
        404
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Sayfa Bulunamadı</h2>
      <p className="text-sm text-gray-500 mb-6 max-w-sm">
        Aradığınız sayfa mevcut değil veya taşınmış olabilir.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors shadow-md"
      >
        Ana Sayfaya Dön
      </Link>
    </div>
  );
}
