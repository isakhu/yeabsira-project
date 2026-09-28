"use client";

import { useState } from "react";
import { exportToCSV } from "@/lib/exportCsv";

// ─── TYPES ───

export interface StatItem {
  label: string;
  value: number;
  color?: string; // tailwind bg color e.g. "bg-amber-500"
}

interface StatMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color?: "gold" | "green" | "blue" | "orange" | "red" | "purple";
  badge?: string;
}

interface BarChartCardProps {
  title: string;
  subtitle?: string;
  items: StatItem[];
  emptyMessage?: string;
}

interface ProgressRingGaugeProps {
  title: string;
  subtitle?: string;
  percentage: number | null; // null means insufficient data
  valueDisplay?: string;
  color?: "gold" | "green" | "blue" | "purple" | "orange";
}

interface EmptyStatisticsStateProps {
  title?: string;
  message?: string;
  icon?: string;
}

interface CSVExportButtonProps {
  filename: string;
  reportName?: string;
  headers: string[] | (() => string[]);
  rows: unknown[] | (() => unknown[]);
  className?: string;
}

// ─── COLOR MAP HELPER ───
const COLOR_CLASSES = {
  gold: {
    bg: "bg-amber-500/10",
    text: "text-brand-gold",
    border: "border-amber-500/20",
    ring: "#f59e0b",
  },
  green: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    ring: "#10b981",
  },
  blue: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/20",
    ring: "#3b82f6",
  },
  orange: {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/20",
    ring: "#f97316",
  },
  red: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/20",
    ring: "#ef4444",
  },
  purple: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/20",
    ring: "#a855f7",
  },
};

// ─── 1. STAT METRIC CARD ───
export function StatMetricCard({
  title,
  value,
  subtitle,
  icon,
  color = "gold",
  badge,
}: StatMetricCardProps) {
  const c = COLOR_CLASSES[color] || COLOR_CLASSES.gold;
  const isInsufficient = value === "Insufficient data" || value === "Not available";

  return (
    <div className={`bg-slate-800 border ${c.border} rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden`}>
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
            {title}
          </span>
          <div className={`text-2xl lg:text-3xl font-extrabold ${isInsufficient ? "text-gray-400 text-lg" : "text-white"}`}>
            {value}
          </div>
        </div>
        <div className={`w-11 h-11 rounded-xl ${c.bg} ${c.text} flex items-center justify-center shrink-0 border ${c.border}`}>
          <i className={`${icon} text-lg`}></i>
        </div>
      </div>

      {(subtitle || badge) && (
        <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
          {subtitle && <span className="text-gray-400">{subtitle}</span>}
          {badge && (
            <span className={`px-2 py-0.5 rounded-full font-medium ${c.bg} ${c.text} border ${c.border}`}>
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 2. BAR CHART CARD (HORIZONTAL DISTRIBUTION BARS) ───
export function BarChartCard({
  title,
  subtitle,
  items,
  emptyMessage = "No data available yet.",
}: BarChartCardProps) {
  const total = items.reduce((acc, item) => acc + item.value, 0);

  return (
    <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mb-4">{subtitle}</p>}
      </div>

      {total === 0 || items.length === 0 ? (
        <div className="py-8 text-center text-gray-500 text-sm flex flex-col items-center justify-center space-y-2">
          <i className="fas fa-chart-bar text-2xl text-slate-600"></i>
          <span>{emptyMessage}</span>
        </div>
      ) : (
        <div className="space-y-4 my-2">
          {items.map((item, idx) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            const barColor = item.color || "bg-amber-500";

            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-300">{item.label}</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">{item.value}</span>
                    <span className="text-xs text-gray-400">({pct}%)</span>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${barColor} transition-all duration-500 rounded-full`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── 3. PROGRESS RING GAUGE ───
export function ProgressRingGauge({
  title,
  subtitle,
  percentage,
  valueDisplay,
  color = "gold",
}: ProgressRingGaugeProps) {
  const c = COLOR_CLASSES[color] || COLOR_CLASSES.gold;
  const isNull = percentage === null || percentage === undefined || isNaN(percentage);

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const validPct = isNull ? 0 : Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (validPct / 100) * circumference;

  return (
    <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 flex flex-col items-center justify-between text-center">
      <div className="w-full text-left mb-2">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>

      <div className="relative my-4 flex items-center justify-center">
        <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="stroke-slate-700"
            strokeWidth="10"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke={isNull ? "#475569" : c.ring}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center text-center p-2">
          {isNull ? (
            <span className="text-xs font-semibold text-gray-400">
              Insufficient<br />data
            </span>
          ) : (
            <>
              <span className={`text-2xl font-extrabold text-white`}>
                {valueDisplay || `${Math.round(validPct)}%`}
              </span>
              <span className="text-[10px] text-gray-400 uppercase font-semibold">Rate</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 4. EMPTY STATISTICS STATE ───
export function EmptyStatisticsState({
  title = "No data available yet.",
  message = "Operational records will populate this statistics view as activities occur.",
  icon = "fas fa-chart-line",
}: EmptyStatisticsStateProps) {
  return (
    <div className="bg-slate-800 border border-slate-700 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center my-4">
      <div className="w-14 h-14 rounded-2xl bg-slate-700/50 text-gray-400 flex items-center justify-center mb-3 text-2xl">
        <i className={icon}></i>
      </div>
      <h4 className="text-base font-bold text-white mb-1">{title}</h4>
      <p className="text-xs text-gray-400 max-w-md">{message}</p>
    </div>
  );
}

// ─── 5. CSV EXPORT BUTTON ───
export function CSVExportButton({
  filename,
  reportName,
  headers,
  rows,
  className,
}: CSVExportButtonProps) {
  const [status, setStatus] = useState<"idle" | "exporting" | "done">("idle");

  function handleExport(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (status === "exporting") return;

    setStatus("exporting");
    try {
      // Execute export synchronously to maintain user gesture activation for browser downloads
      exportToCSV(filename, headers, rows, reportName);
      setStatus("done");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (err) {
      console.error("Export error:", err);
      setStatus("idle");
    }
  }

  const defaultClasses =
    "px-4 py-2 bg-brand-gold/10 hover:bg-brand-gold/20 text-brand-gold border border-brand-gold/30 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50 select-none shadow-sm";

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={status === "exporting"}
      className={className || defaultClasses}
      title="Download report as CSV"
    >
      {status === "exporting" && (
        <>
          <i className="fas fa-circle-notch animate-spin text-brand-gold"></i>
          <span>Generating CSV...</span>
        </>
      )}
      {status === "done" && (
        <>
          <i className="fas fa-check-circle text-emerald-400"></i>
          <span className="text-emerald-400">Downloaded!</span>
        </>
      )}
      {status === "idle" && (
        <>
          <i className="fas fa-download text-brand-gold"></i>
          <span>Export CSV</span>
        </>
      )}
    </button>
  );
}
