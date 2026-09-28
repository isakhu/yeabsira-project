"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
          <i className="fas fa-exclamation-triangle text-3xl text-red-400"></i>
        </div>
        <h1 className="text-5xl font-extrabold text-white mb-4">500</h1>
        <h2 className="text-xl font-bold text-gray-300 mb-4">Server Error</h2>
        <p className="text-gray-400 mb-8">
          An unexpected error occurred. Our team has been notified. Please try again.
        </p>
        <button
          onClick={() => reset()}
          className="bg-brand-gold hover:bg-yellow-400 text-slate-900 px-6 py-3 rounded-xl text-sm font-bold transition-all"
        >
          <i className="fas fa-rotate-right mr-2"></i>Try Again
        </button>
      </div>
    </div>
  );
}
