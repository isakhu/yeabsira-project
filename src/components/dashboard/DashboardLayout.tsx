"use client";

import { useState, useEffect, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { SidebarGroup } from "@/lib/permissions";

interface DashboardLayoutProps {
  children: ReactNode;
  sidebarConfig: SidebarGroup[];
  userName: string;
  userRole: string;
  roleDisplayName: string;
  userId: string;
}

export default function DashboardLayout({
  children,
  sidebarConfig,
  userName,
  userRole,
  roleDisplayName,
  userId,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClick() {
      setUserMenuOpen(false);
    }
    if (userMenuOpen) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [userMenuOpen]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      const data = await res.json();
      router.push(data.redirect || "/");
    } catch {
      router.push("/");
    }
  }

  function isActive(href: string) {
    if (href === pathname) return true;
    // For dashboard root, only exact match
    if (href.split("/").length <= 2) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-[280px] bg-slate-800 border-r border-slate-600 flex flex-col sidebar-transition overflow-y-auto dashboard-scrollbar ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Sidebar header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-600 shrink-0">
          <Link href="/" className="flex flex-col leading-none">
            <span className="text-[10px] font-bold text-brand-gold uppercase tracking-tighter">
              FDRE PPA
            </span>
            <span className="text-xl font-extrabold tracking-tight text-white">
              FMS<span className="text-brand-gold">.</span>
            </span>
          </Link>
          <button
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {sidebarConfig.map((group, gi) => (
            <div key={gi} className={gi > 0 ? "mt-6" : ""}>
              {group.label && (
                <div className="px-3 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  {group.label}
                </div>
              )}
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive(item.href)
                      ? "bg-brand-gold/10 text-brand-gold border border-brand-gold/20"
                      : "text-gray-400 hover:text-white hover:bg-slate-700/50 border border-transparent"
                  }`}
                >
                  <i className={`${item.icon} w-5 text-center text-xs`}></i>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Sidebar footer — Profile & Logout */}
        <div className="p-4 border-t border-slate-600 shrink-0 space-y-1">
          <Link
            href="/profile"
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              pathname === "/profile"
                ? "bg-brand-gold/10 text-brand-gold border border-brand-gold/20"
                : "text-gray-400 hover:text-white hover:bg-slate-700/50 border border-transparent"
            }`}
          >
            <i className="fas fa-user-circle w-5 text-center text-xs"></i>
            <span>Profile</span>
          </Link>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent"
          >
            <i className={`fas ${loggingOut ? "fa-circle-notch animate-spin" : "fa-right-from-bracket"} w-5 text-center text-xs`}></i>
            <span>{loggingOut ? "Signing out..." : "Logout"}</span>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Header */}
        <header className="h-16 bg-slate-800/80 backdrop-blur-md border-b border-slate-600 flex items-center justify-between px-6 shrink-0 sticky top-0 z-30">
          {/* Left: hamburger + breadcrumb */}
          <div className="flex items-center space-x-4">
            <button
              className="lg:hidden text-gray-400 hover:text-white"
              onClick={() => setSidebarOpen(true)}
            >
              <i className="fas fa-bars text-lg"></i>
            </button>
            <span className="text-sm text-gray-400 hidden sm:block">
              <span className="text-brand-gold font-semibold">{roleDisplayName}</span>
              <span className="mx-2 text-slate-600">/</span>
              <span className="text-gray-300">Dashboard</span>
            </span>
          </div>

          {/* Right: user menu */}
          <div className="relative">
            <button
              className="flex items-center space-x-3 hover:bg-slate-700/50 rounded-xl px-3 py-2 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setUserMenuOpen(!userMenuOpen);
              }}
            >
              <div className="w-9 h-9 rounded-full bg-brand-gold flex items-center justify-center shrink-0">
                <i className="fas fa-user text-sm text-slate-900"></i>
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-semibold text-white leading-tight">
                  {userName}
                </div>
                <div className="text-xs text-gray-400 leading-tight">
                  {roleDisplayName}
                </div>
              </div>
              <i className="fas fa-chevron-down text-xs text-gray-500 hidden sm:block"></i>
            </button>

            {/* Dropdown */}
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-slate-600 rounded-xl shadow-xl overflow-hidden z-50">
                <div className="p-4 border-b border-slate-600">
                  <div className="text-sm font-semibold text-white">
                    {userName}
                  </div>
                  <div className="text-xs text-gray-400">{roleDisplayName}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    User ID: {userId}
                  </div>
                </div>
                <div className="p-2">
                  <Link
                    href={`/${userRole.toLowerCase().replace("_", "-")}`}
                    className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-slate-700 hover:text-white transition-colors"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <i className="fas fa-gauge-high w-5 text-center"></i>
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    href="/profile"
                    className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-slate-700 hover:text-white transition-colors"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <i className="fas fa-user-circle w-5 text-center"></i>
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                  >
                    <i className={`fas ${loggingOut ? "fa-circle-notch animate-spin" : "fa-right-from-bracket"} w-5 text-center`}></i>
                    <span>{loggingOut ? "Signing out..." : "Logout"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
