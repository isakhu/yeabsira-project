"use client";

import { useState } from "react";
import StatusBadge from "@/components/dashboard/StatusBadge";

interface ProfileClientProps {
  userId: string;
  name: string;
  role: string;
  roleDisplayName: string;
  active: boolean;
  createdAt: string;
}

export default function ProfileClient({
  userId,
  name,
  role,
  roleDisplayName,
  active,
  createdAt,
}: ProfileClientProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

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
      } else {
        setMessage("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Profile</h1>
        <p className="text-gray-400 mt-1">Account information and password management</p>
      </div>

      {/* Account Information */}
      <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-6">Account Information</h3>
        <div className="space-y-4">
          {[
            { label: "Name", value: name },
            { label: "User ID", value: userId, mono: true },
            { label: "Role", value: roleDisplayName },
            { label: "Account Status", value: active ? "ACTIVE" : "INACTIVE", badge: true },
            {
              label: "Member Since",
              value: new Date(createdAt).toLocaleDateString("en-US", {
                year: "numeric", month: "long", day: "numeric",
              }),
            },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0">
              <span className="text-sm text-gray-400">{item.label}</span>
              {item.badge ? (
                <StatusBadge status={item.value} />
              ) : (
                <span className={`text-sm font-semibold text-white ${item.mono ? "font-mono text-brand-gold" : ""}`}>
                  {item.value}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Password Change */}
      <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-6">Change Password</h3>

        {message && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm flex items-center space-x-2">
            <i className="fas fa-check-circle"></i>
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-center space-x-2">
            <i className="fas fa-exclamation-circle"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
            <input
              type={showPasswords ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
            <input
              type={showPasswords ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
            <input
              type={showPasswords ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
              disabled={loading}
            />
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-sm text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showPasswords}
                onChange={() => setShowPasswords(!showPasswords)}
                className="rounded"
              />
              <span>Show passwords</span>
            </label>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-brand-gold hover:bg-yellow-400 text-slate-900 px-6 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
          >
            {loading ? (
              <span><i className="fas fa-circle-notch animate-spin mr-2"></i>Changing...</span>
            ) : (
              "Change Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
