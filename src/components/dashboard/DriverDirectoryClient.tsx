"use client";

import { useState } from "react";
import StatusBadge from "./StatusBadge";
import DataTable from "./DataTable";
import Link from "next/link";
import { CSVExportButton } from "./StatisticsCharts";

interface DriverItem {
  id: number;
  driverId: string | null;
  licenseNumber: string;
  licenseCategory: string | null;
  licenseIssueDate: string | null;
  licenseExpiry: string;
  status: string;
  yearsOfExperience: number | null;
  medicalCertificateExpiry: string | null;
  trainingStatus: string | null;
  trainingExpiryDate: string | null;
  employee?: {
    id: number;
    employeeId: string | null;
    fullName: string | null;
    firstName: string | null;
    lastName: string | null;
    phoneNumber: string | null;
    email: string | null;
    department: string;
  } | null;
  user?: {
    userId: string;
    name: string;
    active: boolean;
  } | null;
  assignedVehicle?: {
    id: number;
    registration: string;
    type: string;
  } | null;
}

export default function DriverDirectoryClient({
  initialDrivers,
  unassignedEmployees,
  userRole,
}: {
  initialDrivers: DriverItem[];
  unassignedEmployees: { id: number; employeeId: string | null; fullName: string | null; firstName: string | null; lastName: string | null }[];
  userRole: string;
}) {
  const [drivers, setDrivers] = useState<DriverItem[]>(initialDrivers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    employeeId: unassignedEmployees[0]?.id || "",
    driverId: "",
    licenseNumber: "",
    licenseCategory: "Commercial",
    licenseIssueDate: "",
    licenseExpiry: "",
    yearsOfExperience: "3",
    medicalCertificateExpiry: "",
    trainingStatus: "UP_TO_DATE",
    trainingExpiryDate: "",
  });

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  function getExpiryStatus(expiryDateStr: string | null) {
    if (!expiryDateStr) return { label: "N/A", color: "bg-slate-700 text-gray-400" };
    const expiry = new Date(expiryDateStr);
    const now = new Date();

    if (expiry < now) {
      return { label: "EXPIRED", color: "bg-red-500/20 text-red-400 border border-red-500/30" };
    } else if (expiry <= thirtyDaysFromNow) {
      return { label: "EXPIRING", color: "bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold animate-pulse" };
    }
    return { label: "OK", color: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" };
  }

  const filteredDrivers = drivers.filter((d) => {
    const drvId = d.driverId?.toLowerCase() || "";
    const name = (d.employee?.fullName || `${d.employee?.firstName || ""} ${d.employee?.lastName || ""}` || d.user?.name || "").toLowerCase();
    const license = d.licenseNumber.toLowerCase();
    const phone = d.employee?.phoneNumber?.toLowerCase() || "";

    const matchesSearch =
      !search ||
      drvId.includes(search.toLowerCase()) ||
      name.includes(search.toLowerCase()) ||
      license.includes(search.toLowerCase()) ||
      phone.includes(search.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  async function handleCreateDriver(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register driver profile");

      setDrivers([data.driver, ...drivers]);
      setIsCreateOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 w-full flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Search by Driver ID, Name, License Number, Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-gold"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="ON_LEAVE">On Leave</option>
          </select>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <CSVExportButton
            filename="FMS_Driver_Registry"
            reportName="Driver Registry Report"
            headers={["Driver ID", "Driver Name", "License No.", "Category", "License Expiry", "Status", "Assigned Vehicle"]}
            rows={filteredDrivers.map((d) => [
              d.driverId || `DRV-${d.id}`,
              d.employee?.fullName || d.user?.name || "Driver",
              d.licenseNumber,
              d.licenseCategory || "Automobile",
              new Date(d.licenseExpiry).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
              d.status,
              d.assignedVehicle?.registration || "Unassigned",
            ])}
            className="px-3.5 py-2 bg-slate-700/60 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-600 transition-all cursor-pointer whitespace-nowrap"
          />

          {(userRole === "ADMIN" || userRole === "HR") && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 bg-brand-gold hover:bg-yellow-500 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center space-x-2 whitespace-nowrap cursor-pointer"
            >
              <i className="fas fa-id-card"></i>
              <span>Register Driver</span>
            </button>
          )}
        </div>
      </div>

      {/* Driver Data Table */}
      <DataTable
        columns={[
          {
            key: "driverId",
            label: "Driver ID",
            render: (v, row) => (
              <Link href={`/hr/drivers/${(row as unknown as DriverItem).id}`} className="font-mono text-brand-gold font-semibold hover:underline">
                {v as string}
              </Link>
            ),
          },
          {
            key: "driverName",
            label: "Driver Name",
            render: (v, row) => (
              <div>
                <Link href={`/hr/drivers/${(row as unknown as DriverItem).id}`} className="font-semibold text-white hover:text-brand-gold">
                  {v as string}
                </Link>
                <div className="text-xs text-gray-400">
                  Emp ID: {(row as unknown as DriverItem).employee?.employeeId || `EMP-${(row as unknown as DriverItem).employee?.id || "N/A"}`}
                </div>
              </div>
            ),
          },
          { key: "licenseNumber", label: "License No.", render: (v) => <span className="font-mono text-gray-200">{v as string}</span> },
          {
            key: "licenseExpiry",
            label: "License Expiry",
            render: (v) => {
              const expStatus = getExpiryStatus(v as string);
              return (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-300">
                    {v ? new Date(v as string).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A"}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded font-mono ${expStatus.color}`}>{expStatus.label}</span>
                </div>
              );
            },
          },
          { key: "vehicle", label: "Assigned Vehicle", render: (v) => <span className="font-mono text-brand-gold">{v as string}</span> },
          { key: "status", label: "Status", render: (v) => <StatusBadge status={v as string} /> },
          {
            key: "actions",
            label: "Actions",
            render: (_, row) => (
              <Link
                href={`/hr/drivers/${(row as unknown as DriverItem).id}`}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-gray-200 rounded-lg text-xs font-semibold inline-flex items-center space-x-1"
              >
                <i className="fas fa-eye"></i>
                <span>View Profile</span>
              </Link>
            ),
          },
        ]}
        data={filteredDrivers.map((d) => ({
          ...d,
          driverId: d.driverId || `DRV-${d.id}`,
          driverName: d.employee?.fullName || `${d.employee?.firstName || ""} ${d.employee?.lastName || ""}`.trim() || d.user?.name || "N/A",
          vehicle: d.assignedVehicle?.registration || "Unassigned",
        }))}
        emptyMessage="No drivers registered yet."
      />

      {/* Create Driver Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-700 pb-4">
              <h3 className="text-lg font-bold text-white">Register Driver Profile</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-white">
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}

            <form onSubmit={handleCreateDriver} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Link Employee Profile *</label>
                {unassignedEmployees.length > 0 ? (
                  <select
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
                  >
                    {unassignedEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName || `${emp.firstName || ""} ${emp.lastName || ""}`} ({emp.employeeId || `EMP-${emp.id}`})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-amber-400">
                    No unassigned employees found. Please register an Employee first before creating a Driver profile.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Driver ID (Optional Auto-Gen)</label>
                  <input
                    type="text"
                    placeholder="e.g. DRV-001"
                    value={formData.driverId}
                    onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">License Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ETH-DL-984021"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">License Category</label>
                  <select
                    value={formData.licenseCategory}
                    onChange={(e) => setFormData({ ...formData, licenseCategory: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
                  >
                    <option value="Commercial">Commercial</option>
                    <option value="Automobile">Automobile</option>
                    <option value="Heavy Truck">Heavy Truck</option>
                    <option value="Public Bus">Public Bus</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">License Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.licenseExpiry}
                    onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Years of Experience</label>
                  <input
                    type="number"
                    value={formData.yearsOfExperience}
                    onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Medical Expiry Date</label>
                  <input
                    type="date"
                    value={formData.medicalCertificateExpiry}
                    onChange={(e) => setFormData({ ...formData, medicalCertificateExpiry: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 font-semibold rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || unassignedEmployees.length === 0}
                  className="px-5 py-2 bg-brand-gold hover:bg-yellow-500 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md disabled:opacity-50"
                >
                  {isLoading ? "Saving..." : "Register Driver"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
