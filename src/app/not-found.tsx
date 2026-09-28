import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-brand-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-brand-gold/20">
          <i className="fas fa-map-signs text-3xl text-brand-gold"></i>
        </div>
        <h1 className="text-5xl font-extrabold text-white mb-4">404</h1>
        <h2 className="text-xl font-bold text-gray-300 mb-4">Page Not Found</h2>
        <p className="text-gray-400 mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="bg-brand-gold hover:bg-yellow-400 text-slate-900 px-6 py-3 rounded-xl text-sm font-bold transition-all inline-flex items-center"
        >
          <i className="fas fa-home mr-2"></i>Go Home
        </Link>
      </div>
    </div>
  );
}
