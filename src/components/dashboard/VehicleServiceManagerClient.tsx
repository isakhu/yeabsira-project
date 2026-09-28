"use client";

import { useState } from "react";
import StatusBadge from "./StatusBadge";
import DataTable from "./DataTable";
import InteractiveModal from "./InteractiveModal";
import { CSVExportButton } from "./StatisticsCharts";
import { useRouter } from "next/navigation";

export interface ServiceItem {
  id: number;
  serviceType: string;
  dueDate: string;
  mileage: number | null;
  status: string;
  completedAt?: string | null;
  vehicle: {
    id?: number;
    registration: string;
    make?: string;
    model?: string;
  };
}

export interface VehicleOption {
  id: number;
  registration: string;
  make: string;
  model: string;
}

export default function VehicleServiceManagerClient({
  initialServices,
  vehicles,
  userRole,
}: {
  initialServices: ServiceItem[];
  vehicles: VehicleOption[];
  userRole: string;
}) {
  const [services, setServices] = useState<ServiceItem[]>(initialServices);
  const [filter, setFilter] = useState("ALL");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  const [form, setForm] = useState({
    vehicleId: vehicles[0]?.id ? String(vehicles[0].id) : "",
    serviceType: "Oil Change & Filter",
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    mileage: "",
  });

  const filteredServices = services.filter((s) => {
    if (filter === "ALL") return true;
    return s.status === filter;
  });

  const canManage = userRole === "ADMIN" || userRole === "FLEET_MANAGER" || userRole === "MECHANIC";

  async function handleCreateService(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to schedule service");

      const created: ServiceItem = {
        ...data.service,
        dueDate: new Date(data.service.dueDate).toISOString(),
      };

      setServices([created, ...services]);
      setIsOpen(false);
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
      const res = await fetch("/api/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update service status");

      setServices(
        services.map((s) =>
          s.id === id
            ? {
                ...s,
                status: newStatus,
                completedAt: newStatus === "COMPLETED" ? new Date().toISOString() : s.completedAt,
              }
            : s
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
        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {["ALL", "SCHEDULED", "OVERDUE", "COMPLETED", "CANCELLED"].map((st) => (
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

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <CSVExportButton
            filename="FMS_Vehicle_Service_Schedules"
            reportName="Vehicle Service Schedule Report"
            headers={["Service ID", "Vehicle Plate", "Make / Model", "Service Type", "Due Date", "Mileage Target (km)", "Status"]}
            rows={filteredServices.map((s) => [
              `#${s.id}`,
              s.vehicle.registration,
              s.vehicle.make ? `${s.vehicle.make} ${s.vehicle.model}` : "—",
              s.serviceType,
              new Date(s.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
              s.mileage || "—",
              s.status,
            ])}
            className="px-3.5 py-2 bg-slate-700/60 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-600 transition-all cursor-pointer"
          />

          {canManage && (
            <button
              onClick={() => setIsOpen(true)}
              className="px-4 py-2 bg-brand-gold hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg flex items-center gap-2 transition-all cursor-pointer"
            >
              <i className="fas fa-calendar-plus"></i>
              <span>Schedule Service</span>
            </button>
          )}
        </div>
      </div>

      {/* Services Table */}
      <DataTable
        columns={[
          {
            key: "vehicle",
            label: "Vehicle",
            render: (v) => <span className="font-mono text-brand-gold font-bold">{v as string}</span>,
          },
          { key: "vehicleInfo", label: "Make / Model" },
          { key: "serviceType", label: "Service Type" },
          {
            key: "dueDate",
            label: "Due Date",
            render: (v) => new Date(v as string).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          },
          { key: "mileage", label: "Target Mileage" },
          {
            key: "status",
            label: "Status",
            render: (v) => <StatusBadge status={v as string} />,
          },
          {
            key: "actions",
            label: "Action / Workflow",
            render: (_, row) => {
              const item = row as unknown as ServiceItem;
              if (canManage && (item.status === "SCHEDULED" || item.status === "OVERDUE")) {
                return (
                  <div className="flex items-center gap-2">
                    <button
                      disabled={actionLoadingId === item.id}
                      onClick={() => handleStatusChange(item.id, "COMPLETED")}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                    >
                      <i className="fas fa-check"></i>
                      <span>Mark Done</span>
                    </button>
                    <button
                      disabled={actionLoadingId === item.id}
                      onClick={() => handleStatusChange(item.id, "CANCELLED")}
                      className="px-2.5 py-1 bg-red-600/70 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                    >
                      <i className="fas fa-ban"></i>
                      <span>Cancel</span>
                    </button>
                  </div>
                );
              }
              if (item.status === "COMPLETED") {
                return (
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                    <i className="fas fa-check-circle"></i> Completed
                  </span>
                );
              }
              return <span className="text-xs text-gray-500 italic">—</span>;
            },
          },
        ]}
        data={filteredServices.map((s) => ({
          ...s,
          vehicle: s.vehicle.registration,
          vehicleInfo: s.vehicle.make ? `${s.vehicle.make} ${s.vehicle.model}` : "—",
          mileage: s.mileage ? `${s.mileage.toLocaleString()} km` : "—",
        }))}
        emptyMessage="No vehicle service schedules found."
      />

      {/* Schedule Service Modal */}
      <InteractiveModal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Schedule Preventive Vehicle Service">
        <form onSubmit={handleCreateService} className="space-y-4">
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
            <label className="text-xs text-gray-300 block mb-1">Service Type *</label>
            <select
              value={form.serviceType}
              onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
            >
              <option value="Oil Change & Filter">Oil Change & Filter</option>
              <option value="Full Service & Brake Check">Full Service & Brake Check</option>
              <option value="Tire Rotation & Alignment">Tire Rotation & Alignment</option>
              <option value="Brake Pad Replacement">Brake Pad Replacement</option>
              <option value="Transmission Fluid Inspection">Transmission Fluid Inspection</option>
              <option value="Engine Tune-up & Diagnostic">Engine Tune-up & Diagnostic</option>
              <option value="Battery & Electrical Check">Battery & Electrical Check</option>
              <option value="Coolant Flush & Radiator Service">Coolant Flush & Radiator Service</option>
              <option value="Annual Fleet Safety Inspection">Annual Fleet Safety Inspection</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-300 block mb-1">Due Date *</label>
              <input
                type="date"
                required
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
              />
            </div>
            <div>
              <label className="text-xs text-gray-300 block mb-1">Service Mileage (km)</label>
              <input
                type="number"
                placeholder="e.g. 50000"
                value={form.mileage}
                onChange={(e) => setForm({ ...form, mileage: e.target.value })}
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
              {loading ? "Scheduling..." : "Confirm Schedule"}
            </button>
          </div>
        </form>
      </InteractiveModal>
    </div>
  );
}
