"use client";

import { useState } from "react";
import StatusBadge from "./StatusBadge";
import DataTable from "./DataTable";
import InteractiveModal from "./InteractiveModal";
import { CSVExportButton } from "./StatisticsCharts";
import { useRouter } from "next/navigation";

export interface BehaviorItem {
  id: number;
  driverId: number;
  speedEvents: number;
  harshBraking: number;
  highRPM: number;
  acceleration: number;
  date: string;
  driver: {
    id: number;
    driverId?: string | null;
    user?: { name: string; userId?: string } | null;
    employee?: { fullName?: string | null; firstName?: string | null; lastName?: string | null; employeeId?: string | null } | null;
  };
}

export interface DriverOption {
  id: number;
  name: string;
  driverId?: string | null;
  licenseNumber: string;
}

export default function DriverBehaviorClient({
  initialRecords,
  drivers,
  userRole,
}: {
  initialRecords: BehaviorItem[];
  drivers: DriverOption[];
  userRole: string;
}) {
  const [records, setRecords] = useState<BehaviorItem[]>(initialRecords);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const [form, setForm] = useState({
    driverId: drivers[0]?.id ? String(drivers[0].id) : "",
    speedEvents: "0",
    harshBraking: "0",
    highRPM: "0",
    acceleration: "0",
    date: new Date().toISOString().split("T")[0],
  });

  const canManage = userRole === "ADMIN" || userRole === "TRANSPORT_MANAGER" || userRole === "FLEET_MANAGER" || userRole === "HR";

  async function handleLogBehavior(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/behavior", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to log driver behavior");

      const created: BehaviorItem = {
        ...data.record,
        date: new Date(data.record.date).toISOString(),
      };

      setRecords([created, ...records]);
      setIsOpen(false);
      setForm({
        driverId: drivers[0]?.id ? String(drivers[0].id) : "",
        speedEvents: "0",
        harshBraking: "0",
        highRPM: "0",
        acceleration: "0",
        date: new Date().toISOString().split("T")[0],
      });
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function calculateScore(r: BehaviorItem): number {
    return Math.max(0, 100 - (r.speedEvents * 5 + r.harshBraking * 5 + r.highRPM * 3 + r.acceleration * 2));
  }

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800 p-4 rounded-2xl border border-slate-700">
        <div>
          <h3 className="text-base font-bold text-white">Telematics Safety Incident Logs</h3>
          <p className="text-xs text-gray-400">Total recorded trips/events: {records.length}</p>
        </div>

        <div className="flex items-center gap-3">
          <CSVExportButton
            filename="FMS_Driver_Behavior_Telematics"
            reportName="Driver Behavior Telematics Report"
            headers={["Record ID", "Driver Name", "Driver Identifier", "Telematics Date", "Speeding Events", "Harsh Braking", "High RPM", "Harsh Accel", "Safety Score"]}
            rows={records.map((r) => {
              const score = calculateScore(r);
              const name = r.driver.user?.name || r.driver.employee?.fullName || `Driver #${r.driver.id}`;
              const code = r.driver.driverId || r.driver.employee?.employeeId || r.driver.user?.userId || "—";
              return [
                `#${r.id}`,
                name,
                code,
                new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                r.speedEvents,
                r.harshBraking,
                r.highRPM,
                r.acceleration,
                `${score}/100`,
              ];
            })}
            className="px-3.5 py-2 bg-slate-700/60 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-600 transition-all cursor-pointer"
          />

          {canManage && (
            <button
              onClick={() => setIsOpen(true)}
              className="px-4 py-2 bg-brand-gold hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg flex items-center gap-2 transition-all cursor-pointer"
            >
              <i className="fas fa-tachometer-alt"></i>
              <span>Log Behavior Event</span>
            </button>
          )}
        </div>
      </div>

      {/* Behavior Table */}
      <DataTable
        columns={[
          {
            key: "driver",
            label: "Driver",
            render: (v) => <span className="font-semibold text-white">{v as string}</span>,
          },
          { key: "driverCode", label: "Driver ID" },
          {
            key: "date",
            label: "Date",
            render: (v) => new Date(v as string).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          },
          { key: "speeding", label: "Speed Events" },
          { key: "harshBraking", label: "Harsh Braking" },
          { key: "acceleration", label: "Harsh Accel." },
          {
            key: "score",
            label: "Safety Rating",
            render: (v) => {
              const scoreNum = Number(v);
              const badgeStatus = scoreNum >= 80 ? "ACTIVE" : scoreNum >= 60 ? "MEDIUM" : "CRITICAL";
              return (
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${scoreNum >= 80 ? "text-emerald-400" : scoreNum >= 60 ? "text-amber-400" : "text-red-400"}`}>
                    {scoreNum}/100
                  </span>
                  <StatusBadge status={badgeStatus} />
                </div>
              );
            },
          },
        ]}
        data={records.map((r) => {
          const score = calculateScore(r);
          return {
            ...r,
            driver: r.driver.user?.name || r.driver.employee?.fullName || `Driver #${r.driver.id}`,
            driverCode: r.driver.driverId || r.driver.employee?.employeeId || r.driver.user?.userId || "—",
            speeding: `${r.speedEvents} events`,
            harshBraking: `${r.harshBraking} events`,
            acceleration: `${r.acceleration} events`,
            score: score.toString(),
          };
        })}
        emptyMessage="No driver behavior telemetry records found."
      />

      {/* Log Behavior Modal */}
      <InteractiveModal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Record Driver Telematics Incident">
        <form onSubmit={handleLogBehavior} className="space-y-4">
          {error && <div className="p-3 bg-red-900/50 border border-red-700 text-red-200 rounded-xl text-sm">{error}</div>}

          <div>
            <label className="text-xs text-gray-300 block mb-1">Target Driver *</label>
            <select
              required
              value={form.driverId}
              onChange={(e) => setForm({ ...form, driverId: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
            >
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.driverId || d.licenseNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-300 block mb-1">Event Date *</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-300 block mb-1">Speeding Violations</label>
              <input
                type="number"
                min="0"
                value={form.speedEvents}
                onChange={(e) => setForm({ ...form, speedEvents: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
              />
            </div>
            <div>
              <label className="text-xs text-gray-300 block mb-1">Harsh Braking Events</label>
              <input
                type="number"
                min="0"
                value={form.harshBraking}
                onChange={(e) => setForm({ ...form, harshBraking: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-300 block mb-1">High RPM / Overrevs</label>
              <input
                type="number"
                min="0"
                value={form.highRPM}
                onChange={(e) => setForm({ ...form, highRPM: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
              />
            </div>
            <div>
              <label className="text-xs text-gray-300 block mb-1">Rapid Acceleration</label>
              <input
                type="number"
                min="0"
                value={form.acceleration}
                onChange={(e) => setForm({ ...form, acceleration: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 font-semibold rounded-xl text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-brand-gold hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm disabled:opacity-50"
            >
              {loading ? "Recording..." : "Save Telematics Log"}
            </button>
          </div>
        </form>
      </InteractiveModal>
    </div>
  );
}
