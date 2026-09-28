"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to change password");
        setLoading(false);
        return;
      }

      // Redirect to dashboard
      router.push(data.redirect || "/");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Top Bar */}
      <div className="w-full border-b border-slate-600 bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex flex-col leading-none">
            <span className="text-xs font-bold text-brand-gold uppercase tracking-tighter">FDRE PPA</span>
            <span className="text-2xl font-extrabold tracking-tight text-white">FMS<span className="text-brand-gold">.</span></span>
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            <i className="fas fa-right-from-bracket mr-2"></i>Logout
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-brand-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-brand-gold/20">
              <i className="fas fa-key text-2xl text-brand-gold"></i>
            </div>
            <h1 className="text-2xl font-extrabold text-white mb-2">
              Password Change Required
            </h1>
            <p className="text-gray-400">
              You must change your password before accessing the system.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-3">
              <i className="fas fa-exclamation-circle text-red-400 mt-0.5"></i>
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
              <input
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl py-3.5 px-4 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                disabled={loading}
                placeholder="Enter your current password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
              <input
                type={showPasswords ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl py-3.5 px-4 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                disabled={loading}
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
              <input
                type={showPasswords ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl py-3.5 px-4 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                disabled={loading}
                placeholder="Re-enter new password"
              />
            </div>
            <label className="flex items-center space-x-2 text-sm text-gray-400 cursor-pointer">
              <input type="checkbox" checked={showPasswords} onChange={() => setShowPasswords(!showPasswords)} className="rounded" />
              <span>Show passwords</span>
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-gold hover:bg-yellow-400 text-slate-900 py-3.5 rounded-xl text-base font-bold transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <><i className="fas fa-circle-notch animate-spin"></i><span>Changing Password...</span></>
              ) : (
                <><i className="fas fa-key"></i><span>Change Password & Continue</span></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
