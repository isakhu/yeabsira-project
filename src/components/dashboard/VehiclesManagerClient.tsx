"use client";

import { useState } from "react";
import StatusBadge from "./StatusBadge";
import DataTable from "./DataTable";
import InteractiveModal from "./InteractiveModal";
import { CSVExportButton } from "./StatisticsCharts";
import { useRouter } from "next/navigation";

export interface VehicleItem {
  id: number;
  registration: string;
  type: string;
  make: string;
  model: string;
  year: number;
  status: string;
  mileage: number;
  fuelType: string;
  currentDriver?: {
    user?: {
      name: string;
    } | null;
  } | null;
}

export default function VehiclesManagerClient({
  initialVehicles,
  userRole,
}: {
  initialVehicles: VehicleItem[];
  userRole: string;
}) {
  const [vehicles, setVehicles] = useState<VehicleItem[]>(initialVehicles);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleItem | null>(null);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: "IDLE", mileage: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const [addForm, setAddForm] = useState({
    registration: "",
    type: "SUV",
    make: "Toyota",
    model: "Land Cruiser",
    year: "2023",
    fuelType: "Diesel",
    mileage: "0",
    status: "IDLE",
  });

  const canManage = userRole === "ADMIN" || userRole === "FLEET_MANAGER";

  const filteredVehicles = vehicles.filter((v) => {
    const matchesFilter = filter === "ALL" ? true : v.status === filter;
    const matchesSearch =
      search === "" ||
      v.registration.toLowerCase().includes(search.toLowerCase()) ||
      v.make.toLowerCase().includes(search.toLowerCase()) ||
      v.model.toLowerCase().includes(search.toLowerCase()) ||
      (v.currentDriver?.user?.name && v.currentDriver.user.name.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  async function handleAddVehicle(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add vehicle");

      setVehicles([data.vehicle, ...vehicles]);
      setIsAddOpen(false);
      setAddForm({
        registration: "",
        type: "SUV",
        make: "Toyota",
        model: "Land Cruiser",
        year: "2023",
        fuelType: "Diesel",
        mileage: "0",
        status: "IDLE",
      });
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVehicle) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/vehicles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedVehicle.id,
          status: statusForm.status,
          mileage: statusForm.mileage ? Number(statusForm.mileage) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update vehicle");

      setVehicles(
        vehicles.map((v) =>
          v.id === selectedVehicle.id
            ? {
                ...v,
                status: statusForm.status,
                mileage: statusForm.mileage ? Number(statusForm.mileage) : v.mileage,
              }
            : v
        )
      );
      setIsStatusOpen(false);
      setSelectedVehicle(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800 p-4 rounded-2xl border border-slate-700">
        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <i className="fas fa-search absolute left-3 top-2.5 text-xs text-gray-500"></i>
            <input
              type="text"
              placeholder="Search plate, make, model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-gold"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {["ALL", "IDLE", "FIELD_WORK", "GARAGE", "OUT_OF_SERVICE"].map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filter === st
                    ? "bg-brand-gold text-slate-950 shadow-md"
                    : "text-gray-400 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <CSVExportButton
            filename="FMS_Fleet_Vehicles_Inventory"
            reportName="Fleet Vehicles Inventory Report"
            headers={["Plate No.", "Type", "Make / Model", "Year", "Fuel Type", "Current Mileage (km)", "Assigned Driver", "Operational Status"]}
            rows={filteredVehicles.map((v) => [
              v.registration,
              v.type,
              `${v.make} ${v.model}`,
              v.year,
              v.fuelType,
              v.mileage,
              v.currentDriver?.user?.name || "Unassigned",
              v.status,
            ])}
            className="px-3.5 py-2 bg-slate-700/60 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-600 transition-all cursor-pointer"
          />

          {canManage && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2 bg-brand-gold hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg flex items-center gap-2 transition-all cursor-pointer"
            >
              <i className="fas fa-plus"></i>
              <span>Add Vehicle</span>
            </button>
          )}
        </div>
      </div>

      {/* Vehicles Table */}
      <DataTable
        columns={[
          {
            key: "registration",
            label: "Registration",
            render: (v) => <span className="font-mono text-brand-gold font-bold">{v as string}</span>,
          },
          { key: "type", label: "Type" },
          { key: "make", label: "Make / Model" },
          { key: "year", label: "Year" },
          { key: "mileage", label: "Mileage" },
          { key: "fuel", label: "Fuel" },
          { key: "driver", label: "Assigned Driver" },
          {
            key: "status",
            label: "Status",
            render: (v) => <StatusBadge status={v as string} />,
          },
          ...(canManage
            ? [
                {
                  key: "actions",
                  label: "Actions",
                  render: (_: unknown, row: Record<string, unknown>) => {
                    const item = row as unknown as VehicleItem;
                    return (
                      <button
                        onClick={() => {
                          setSelectedVehicle(item);
                          setStatusForm({
                            status: item.status,
                            mileage: String(item.mileage),
                          });
                          setIsStatusOpen(true);
                        }}
                        className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <i className="fas fa-sliders text-[10px] text-brand-gold"></i>
                        <span>Update Status</span>
                      </button>
                    );
                  },
                },
              ]
            : []),
        ]}
        data={filteredVehicles.map((v) => ({
          ...v,
          registration: v.registration,
          type: v.type,
          make: `${v.make} ${v.model}`,
          year: v.year,
          mileage: `${v.mileage.toLocaleString()} km`,
          fuel: v.fuelType,
          driver: v.currentDriver?.user?.name || "—",
          status: v.status,
        }))}
        emptyMessage="No fleet vehicles found."
      />

      {/* Add Vehicle Modal */}
      <InteractiveModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register New Fleet Vehicle">
        <form onSubmit={handleAddVehicle} className="space-y-4">
          {error && <div className="p-3 bg-red-900/50 border border-red-700 text-red-200 rounded-xl text-sm">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-300 block mb-1">Registration (Plate No.) *</label>
              <input
                required
                placeholder="e.g. AA-9900"
                value={addForm.registration}
                onChange={(e) => setAddForm({ ...addForm, registration: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
              />
            </div>
            <div>
              <label className="text-xs text-gray-300 block mb-1">Vehicle Type *</label>
              <select
                value={addForm.type}
                onChange={(e) => setAddForm({ ...addForm, type: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
              >
                <option value="SUV">SUV</option>
                <option value="Sedan">Sedan</option>
                <option value="Bus">Bus</option>
                <option value="Pickup">Pickup</option>
                <option value="Van">Van</option>
                <option value="Truck">Truck</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-300 block mb-1">Make *</label>
              <input
                required
                placeholder="e.g. Toyota, Isuzu"
                value={addForm.make}
                onChange={(e) => setAddForm({ ...addForm, make: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
              />
            </div>
            <div>
              <label className="text-xs text-gray-300 block mb-1">Model *</label>
              <input
                required
                placeholder="e.g. Land Cruiser, Hilux"
                value={addForm.model}
                onChange={(e) => setAddForm({ ...addForm, model: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-300 block mb-1">Year *</label>
              <input
                type="number"
                required
                value={addForm.year}
                onChange={(e) => setAddForm({ ...addForm, year: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
              />
            </div>
            <div>
              <label className="text-xs text-gray-300 block mb-1">Fuel Type *</label>
              <select
                value={addForm.fuelType}
                onChange={(e) => setAddForm({ ...addForm, fuelType: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
              >
                <option value="Diesel">Diesel</option>
                <option value="Petrol">Petrol</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-300 block mb-1">Initial Mileage (km)</label>
              <input
                type="number"
                value={addForm.mileage}
                onChange={(e) => setAddForm({ ...addForm, mileage: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 font-semibold rounded-xl text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-brand-gold hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Vehicle"}
            </button>
          </div>
        </form>
      </InteractiveModal>

      {/* Update Status Modal */}
      <InteractiveModal
        isOpen={isStatusOpen}
        onClose={() => {
          setIsStatusOpen(false);
          setSelectedVehicle(null);
        }}
        title={`Update Status: ${selectedVehicle?.registration || ""}`}
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          {error && <div className="p-3 bg-red-900/50 border border-red-700 text-red-200 rounded-xl text-sm">{error}</div>}

          <div>
            <label className="text-xs text-gray-300 block mb-1">Operational Status *</label>
            <select
              value={statusForm.status}
              onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
            >
              <option value="IDLE">IDLE (Available in Pool)</option>
              <option value="FIELD_WORK">FIELD_WORK (Dispatched)</option>
              <option value="GARAGE">GARAGE (Under Repair/Maintenance)</option>
              <option value="OUT_OF_SERVICE">OUT_OF_SERVICE (Decommissioned/Grounded)</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-300 block mb-1">Odometer Mileage (km)</label>
            <input
              type="number"
              value={statusForm.mileage}
              onChange={(e) => setStatusForm({ ...statusForm, mileage: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={() => {
                setIsStatusOpen(false);
                setSelectedVehicle(null);
              }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 font-semibold rounded-xl text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-brand-gold hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm disabled:opacity-50"
            >
              {loading ? "Updating..." : "Save Status"}
            </button>
          </div>
        </form>
      </InteractiveModal>
    </div>
  );
}
