"use client";

import { useState } from "react";
import StatusBadge from "./StatusBadge";
import DataTable from "./DataTable";
import InteractiveModal from "./InteractiveModal";
import { CSVExportButton } from "./StatisticsCharts";
import { useRouter } from "next/navigation";

export interface MaintenanceItem {
  id: number;
  problem: string;
  description?: string | null;
  priority: string;
  status: string;
  createdAt: string;
  completedAt?: string | null;
  vehicle: {
    id?: number;
    registration: string;
    make?: string;
    model?: string;
  };
  mechanic?: {
    name?: string | null;
    userId?: string | null;
  } | null;
}

export interface VehicleOption {
  id: number;
  registration: string;
  make: string;
  model: string;
}

export default function MaintenanceManagerClient({
  initialJobs,
  vehicles,
  userRole,
}: {
  initialJobs: MaintenanceItem[];
  vehicles: VehicleOption[];
  userRole: string;
}) {
  const [jobs, setJobs] = useState<MaintenanceItem[]>(initialJobs);
  const [filter, setFilter] = useState("ALL");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  const [form, setForm] = useState({
    vehicleId: vehicles[0]?.id ? String(vehicles[0].id) : "",
    problem: "",
    description: "",
    priority: "MEDIUM",
  });

  const filteredJobs = jobs.filter((j) => {
    if (filter === "ALL") return true;
    return j.status === filter;
  });

  const canManage = userRole === "ADMIN" || userRole === "FLEET_MANAGER" || userRole === "MECHANIC";

  async function handleCreateJob(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create maintenance job");

      const created: MaintenanceItem = {
        ...data.job,
        createdAt: new Date().toISOString(),
        vehicle: vehicles.find((v) => v.id === Number(form.vehicleId)) || {
          registration: "Selected Vehicle",
        },
      };

      setJobs([created, ...jobs]);
      setIsOpen(false);
      setForm({
        vehicleId: vehicles[0]?.id ? String(vehicles[0].id) : "",
        problem: "",
        description: "",
        priority: "MEDIUM",
      });
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id: number, newStatus: string) {
    setActionLoadingId(id);
    try {
      const res = await fetch("/api/maintenance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update maintenance status");

      setJobs(
        jobs.map((j) =>
          j.id === id
            ? {
                ...j,
                status: newStatus,
                completedAt: newStatus === "COMPLETED" ? new Date().toISOString() : j.completedAt,
              }
            : j
        )
      );
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Action Toolbar & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800 p-4 rounded-2xl border border-slate-700">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {["ALL", "PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === st
                  ? "bg-brand-gold text-slate-950 shadow-md"
                  : "text-gray-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <CSVExportButton
            filename="FMS_Maintenance_Work_Orders"
            reportName="Maintenance Work Orders Report"
            headers={["Work Order ID", "Vehicle Plate", "Make / Model", "Problem Issue", "Priority", "Status", "Assigned Mechanic", "Date Logged"]}
            rows={filteredJobs.map((j) => [
              `#${j.id}`,
              j.vehicle.registration,
              j.vehicle.make ? `${j.vehicle.make} ${j.vehicle.model}` : "—",
              j.problem,
              j.priority,
              j.status,
              j.mechanic?.name || "Unassigned",
              new Date(j.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            ])}
            className="px-3.5 py-2 bg-slate-700/60 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-600 transition-all cursor-pointer"
          />

          {canManage && (
            <button
              onClick={() => setIsOpen(true)}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-xs shadow-lg flex items-center gap-2 transition-all cursor-pointer"
            >
              <i className="fas fa-wrench"></i>
              <span>Log Maintenance Job</span>
            </button>
          )}
        </div>
      </div>

      {/* Maintenance Table */}
      <DataTable
        columns={[
          {
            key: "vehicle",
            label: "Vehicle",
            render: (v) => <span className="font-mono text-brand-gold font-bold">{v as string}</span>,
          },
          { key: "vehicleInfo", label: "Make / Model" },
          { key: "problem", label: "Problem / Symptom" },
          {
            key: "priority",
            label: "Priority",
            render: (v) => <StatusBadge status={v as string} />,
          },
          { key: "mechanic", label: "Assigned To" },
          {
            key: "created",
            label: "Date Logged",
            render: (v) => new Date(v as string).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          },
          {
            key: "status",
            label: "Status",
            render: (v) => <StatusBadge status={v as string} />,
          },
          {
            key: "actions",
            label: "Workflow Actions",
            render: (_, row) => {
              const item = row as unknown as MaintenanceItem;
              if (canManage && item.status === "PENDING") {
                return (
                  <div className="flex items-center gap-2">
                    <button
                      disabled={actionLoadingId === item.id}
                      onClick={() => handleStatusChange(item.id, "IN_PROGRESS")}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                    >
                      <i className="fas fa-play text-[10px]"></i>
                      <span>Start Work</span>
                    </button>
                    <button
                      disabled={actionLoadingId === item.id}
                      onClick={() => handleStatusChange(item.id, "CANCELLED")}
                      className="px-2.5 py-1 bg-red-600/70 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                    >
                      <i className="fas fa-ban text-[10px]"></i>
                      <span>Cancel</span>
                    </button>
                  </div>
                );
              }
              if (canManage && item.status === "IN_PROGRESS") {
                return (
                  <div className="flex items-center gap-2">
                    <button
                      disabled={actionLoadingId === item.id}
                      onClick={() => handleStatusChange(item.id, "COMPLETED")}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                    >
                      <i className="fas fa-check text-[10px]"></i>
                      <span>Mark Fixed</span>
                    </button>
                    <button
                      disabled={actionLoadingId === item.id}
                      onClick={() => handleStatusChange(item.id, "CANCELLED")}
                      className="px-2.5 py-1 bg-red-600/70 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                    >
                      <i className="fas fa-ban text-[10px]"></i>
                      <span>Cancel</span>
                    </button>
                  </div>
                );
              }
              if (item.status === "COMPLETED") {
                return (
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                    <i className="fas fa-check-circle"></i> Resolved
                  </span>
                );
              }
              return <span className="text-xs text-gray-500 italic">—</span>;
            },
          },
        ]}
        data={filteredJobs.map((j) => ({
          ...j,
          vehicle: j.vehicle.registration,
          vehicleInfo: j.vehicle.make ? `${j.vehicle.make} ${j.vehicle.model}` : "—",
          mechanic: j.mechanic?.name || "Unassigned",
          created: j.createdAt,
        }))}
        emptyMessage="No maintenance work orders found."
      />

      {/* Log Maintenance Modal */}
      <InteractiveModal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Log Repair / Maintenance Work Order">
        <form onSubmit={handleCreateJob} className="space-y-4">
          {error && <div className="p-3 bg-red-900/50 border border-red-700 text-red-200 rounded-xl text-sm">{error}</div>}

          <div>
            <label className="text-xs text-gray-300 block mb-1">Target Vehicle *</label>
            <select
              required
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registration} — {v.make} {v.model}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-300 block mb-1">Problem Title / Issue *</label>
            <input
              required
              placeholder="e.g. Engine overheating, Brake pad wear, AC malfunction"
              value={form.problem}
              onChange={(e) => setForm({ ...form, problem: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
            />
          </div>

          <div>
            <label className="text-xs text-gray-300 block mb-1">Priority Level *</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-300 block mb-1">Detailed Symptoms / Diagnosis Notes</label>
            <textarea
              rows={3}
              placeholder="Detailed description of defects, noise patterns, or required replacement parts..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
            />
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
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-sm disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Create Work Order"}
            </button>
          </div>
        </form>
      </InteractiveModal>
    </div>
  );
}
