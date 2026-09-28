"use client";

import { useState } from "react";
import StatusBadge from "./StatusBadge";
import DataTable from "./DataTable";
import { useRouter } from "next/navigation";
import { CSVExportButton } from "./StatisticsCharts";

interface AssignmentItem {
  id: number;
  destination: string;
  departure: string;
  status: string;
  vehicle: {
    id: number;
    registration: string;
    type: string;
    status: string;
  };
  driver: {
    id: number;
    user?: { name: string; userId: string } | null;
    employee?: { fullName: string | null; firstName: string | null; lastName: string | null; phoneNumber: string | null } | null;
  };
}

interface VehicleOpt {
  id: number;
  registration: string;
  type: string;
  status: string;
}

interface DriverOpt {
  id: number;
  driverId: string | null;
  licenseNumber: string;
  employee?: { fullName: string | null; firstName: string | null; lastName: string | null } | null;
  user?: { name: string } | null;
}

export default function TransportAssignmentsClient({
  initialAssignments,
  availableVehicles,
  activeDrivers,
  userRole,
}: {
  initialAssignments: AssignmentItem[];
  availableVehicles: VehicleOpt[];
  activeDrivers: DriverOpt[];
  userRole: string;
}) {
  const [assignments, setAssignments] = useState<AssignmentItem[]>(initialAssignments);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const [form, setForm] = useState({
    vehicleId: availableVehicles[0]?.id ? String(availableVehicles[0].id) : "",
    driverId: activeDrivers[0]?.id ? String(activeDrivers[0].id) : "",
    destination: "",
    departure: new Date().toISOString().slice(0, 16),
  });

  async function handleCreateDispatch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create assignment");

      setAssignments([data.assignment, ...assignments]);
      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800 p-4 rounded-2xl border border-slate-700">
        <div>
          <h3 className="text-lg font-bold text-white">Active & Scheduled Dispatches</h3>
          <p className="text-xs text-gray-400">Total records: {assignments.length}</p>
        </div>

        <div className="flex items-center gap-3">
          <CSVExportButton
            filename="FMS_Driver_Assignments_Dispatches"
            reportName="Driver Assignments & Dispatches Report"
            headers={["Trip ID", "Vehicle Plate", "Vehicle Type", "Assigned Driver", "Destination", "Departure Time", "Status"]}
            rows={assignments.map((a) => [
              `#${a.id}`,
              a.vehicle.registration,
              a.vehicle.type,
              a.driver.user?.name || a.driver.employee?.fullName || "Driver",
              a.destination,
              new Date(a.departure).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
              a.status,
            ])}
            className="px-3.5 py-2 bg-slate-700/60 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-600 transition-all cursor-pointer"
          />

          {(userRole === "ADMIN" || userRole === "TRANSPORT_MANAGER" || userRole === "FLEET_MANAGER") && (
            <button
              onClick={() => setIsOpen(true)}
              className="px-4 py-2 bg-brand-gold hover:bg-yellow-500 text-slate-950 font-bold rounded-xl text-sm shadow-md flex items-center space-x-2 cursor-pointer"
            >
              <i className="fas fa-paper-plane"></i>
              <span>Dispatch Vehicle & Driver</span>
            </button>
          )}
        </div>
      </div>

      <DataTable
        columns={[
          {
            key: "vehicle",
            label: "Vehicle (Plate)",
            render: (v) => <span className="font-mono text-brand-gold font-bold">{v as string}</span>,
          },
          { key: "driverName", label: "Driver Name" },
          { key: "phone", label: "Contact Phone" },
          { key: "destination", label: "Destination" },
          {
            key: "departure",
            label: "Departure Time",
            render: (v) =>
              new Date(v as string).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
          },
          { key: "status", label: "Status", render: (v) => <StatusBadge status={v as string} /> },
        ]}
        data={assignments.map((a) => {
          const drvName =
            a.driver?.user?.name ||
            a.driver?.employee?.fullName ||
            `${a.driver?.employee?.firstName || ""} ${a.driver?.employee?.lastName || ""}`.trim() ||
            "Driver";

          return {
            ...a,
            vehicle: a.vehicle?.registration || "N/A",
            driverName: drvName,
            phone: a.driver?.employee?.phoneNumber || "N/A",
          };
        })}
        emptyMessage="No driver assignments recorded."
      />

      {/* Dispatch Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-700 pb-4">
              <h3 className="text-lg font-bold text-white">Dispatch Vehicle & Assign Driver</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}

            <form onSubmit={handleCreateDispatch} className="space-y-4">
              <div>
                <label className="text-xs text-gray-300 block mb-1">Select Available Vehicle (IDLE) *</label>
                {availableVehicles.length > 0 ? (
                  <select
                    required
                    value={form.vehicleId}
                    onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
                  >
                    {availableVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.registration} ({v.type} — {v.status})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-amber-400">
                    No available IDLE vehicles. Free a vehicle or update status first.
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-300 block mb-1">Select Driver *</label>
                {activeDrivers.length > 0 ? (
                  <select
                    required
                    value={form.driverId}
                    onChange={(e) => setForm({ ...form, driverId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
                  >
                    {activeDrivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.employee?.fullName || `${d.employee?.firstName || ""} ${d.employee?.lastName || ""}` || d.user?.name || "Driver"} (License: {d.licenseNumber})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-amber-400">
                    No active drivers registered.
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-300 block mb-1">Destination *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Adama Regional Inspection Site"
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div>
                <label className="text-xs text-gray-300 block mb-1">Departure Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={form.departure}
                  onChange={(e) => setForm({ ...form, departure: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 font-semibold rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || availableVehicles.length === 0 || activeDrivers.length === 0}
                  className="px-5 py-2 bg-brand-gold hover:bg-yellow-500 text-slate-950 font-bold rounded-xl text-sm disabled:opacity-50"
                >
                  {loading ? "Dispatching..." : "Dispatch Now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
