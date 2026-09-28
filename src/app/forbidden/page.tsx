import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
          <i className="fas fa-shield-halved text-3xl text-red-400"></i>
        </div>
        <h1 className="text-5xl font-extrabold text-white mb-4">403</h1>
        <h2 className="text-xl font-bold text-gray-300 mb-4">Access Denied</h2>
        <p className="text-gray-400 mb-8">
          You do not have permission to access this page. This area is restricted to authorized personnel only.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="bg-brand-gold hover:bg-yellow-400 text-slate-900 px-6 py-3 rounded-xl text-sm font-bold transition-all"
          >
            <i className="fas fa-home mr-2"></i>Go Home
          </Link>
          <Link
            href="/signin"
            className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all border border-slate-600"
          >
            <i className="fas fa-right-to-bracket mr-2"></i>Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
