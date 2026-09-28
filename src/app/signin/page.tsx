"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const expired = searchParams.get("expired") === "true";

  useEffect(() => {
    // Check if already logged in
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.isLoggedIn && data.dashboardRoute) {
          router.replace(data.dashboardRoute);
        }
      })
      .catch(() => {});
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!userId.trim()) {
      setError("Please enter your User ID");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Sign in failed. Please try again.");
        setLoading(false);
        return;
      }

      // Redirect to dashboard or forced password change
      router.push(data.redirect);
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Top Bar */}
      <div className="w-full border-b border-slate-600 bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center">
          <Link href="/" className="flex flex-col leading-none">
            <span className="text-xs font-bold text-brand-gold uppercase tracking-tighter">
              FDRE PPA
            </span>
            <span className="text-2xl font-extrabold tracking-tight text-white">
              FMS<span className="text-brand-gold">.</span>
            </span>
          </Link>
        </div>
      </div>

      {/* Sign In Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-brand-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-brand-gold/20">
              <i className="fas fa-truck text-2xl text-brand-gold"></i>
            </div>
            <h1 className="text-3xl font-extrabold text-white mb-2">FMS</h1>
            <p className="text-gray-400 text-lg">Fleet Management System</p>
          </div>

          {/* Expired Session Notice */}
          {expired && (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start space-x-3">
              <i className="fas fa-clock text-yellow-400 mt-0.5"></i>
              <p className="text-yellow-200 text-sm">
                Your session has expired. Please sign in again.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-3">
              <i className="fas fa-exclamation-circle text-red-400 mt-0.5"></i>
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="userId"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                User ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fas fa-user text-gray-500"></i>
                </div>
                <input
                  id="userId"
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter your User ID"
                  className="w-full bg-slate-800 border border-slate-600 text-white placeholder-gray-500 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors"
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fas fa-lock text-gray-500"></i>
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-slate-800 border border-slate-600 text-white placeholder-gray-500 rounded-xl py-3.5 pl-12 pr-12 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  <i
                    className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                  ></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-gold hover:bg-yellow-400 text-slate-900 py-3.5 rounded-xl text-base font-bold transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <i className="fas fa-circle-notch animate-spin"></i>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-right-to-bracket"></i>
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-10 text-center">
            <p className="text-gray-500 text-xs">
              Fleet Management System — FDRE Public Procurement Agency
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <i className="fas fa-circle-notch animate-spin text-brand-gold text-3xl"></i>
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
