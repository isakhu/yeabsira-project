"use client";

import { useState } from "react";
import StatusBadge from "./StatusBadge";
import DataTable from "./DataTable";
import { CSVExportButton } from "./StatisticsCharts";

interface EmployeeItem {
  id: number;
  employeeId: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  fullName: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  phoneNumber: string | null;
  alternatePhoneNumber: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  department: string;
  position: string;
  employmentType: string | null;
  hireDate: string | null;
  status: string;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
  notes: string | null;
  user?: {
    id: number;
    userId: string;
    name: string;
    role: string;
    active: boolean;
  } | null;
  driver?: {
    id: number;
    driverId: string | null;
    licenseNumber: string;
    status: string;
  } | null;
}

export default function EmployeeDirectoryClient({
  initialEmployees,
  userRole,
}: {
  initialEmployees: EmployeeItem[];
  userRole: string;
}) {
  const [employees, setEmployees] = useState<EmployeeItem[]>(initialEmployees);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedEmp, setSelectedEmp] = useState<EmployeeItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    employeeId: "",
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "Male",
    dateOfBirth: "",
    phoneNumber: "",
    alternatePhoneNumber: "",
    email: "",
    address: "",
    city: "",
    department: "Transport & Fleet Operations",
    position: "Staff",
    employmentType: "FULL_TIME",
    hireDate: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
    notes: "",
    createSystemAccount: false,
    accountUserId: "",
    accountPassword: "",
    accountRole: "DRIVER",
  });

  const departments = [
    "ALL",
    "Administration",
    "Transport & Fleet Operations",
    "Human Resources",
    "Maintenance",
    "Fuel Management",
  ];

  const filteredEmployees = employees.filter((e) => {
    const empId = e.employeeId?.toLowerCase() || "";
    const name = (e.fullName || `${e.firstName || ""} ${e.lastName || ""}`).toLowerCase();
    const phone = e.phoneNumber?.toLowerCase() || "";
    const email = e.email?.toLowerCase() || "";
    const userName = e.user?.name.toLowerCase() || "";

    const matchesSearch =
      !search ||
      empId.includes(search.toLowerCase()) ||
      name.includes(search.toLowerCase()) ||
      phone.includes(search.toLowerCase()) ||
      email.includes(search.toLowerCase()) ||
      userName.includes(search.toLowerCase());

    const matchesDept = department === "ALL" || e.department === department;
    const matchesStatus = statusFilter === "ALL" || e.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  async function handleCreateEmployee(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create employee");

      setEmployees([data.employee, ...employees]);
      setSuccessMsg("Employee registered successfully!");
      setIsCreateOpen(false);

      // Reset form
      setFormData({
        employeeId: "",
        firstName: "",
        middleName: "",
        lastName: "",
        gender: "Male",
        dateOfBirth: "",
        phoneNumber: "",
        alternatePhoneNumber: "",
        email: "",
        address: "",
        city: "",
        department: "Transport & Fleet Operations",
        position: "Staff",
        employmentType: "FULL_TIME",
        hireDate: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        emergencyContactRelationship: "",
        notes: "",
        createSystemAccount: false,
        accountUserId: "",
        accountPassword: "",
        accountRole: "DRIVER",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleStatus(emp: EmployeeItem) {
    const newStatus = emp.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await fetch(`/api/employees/${emp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      setEmployees(employees.map((e) => (e.id === emp.id ? { ...e, status: newStatus } : e)));
      if (selectedEmp && selectedEmp.id === emp.id) {
        setSelectedEmp({ ...selectedEmp, status: newStatus });
      }
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 w-full flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Search by Employee ID, Name, Phone, Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-gold"
            />
          </div>

          {/* Department Filter */}
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d === "ALL" ? "All Departments" : d}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <CSVExportButton
            filename="FMS_Personnel_Employee_Directory"
            reportName="Personnel Employee Directory Report"
            headers={["Employee ID", "Full Name", "Department", "Position", "Phone Number", "Email", "Status"]}
            rows={filteredEmployees.map((e) => [
              e.employeeId || `EMP-${e.id}`,
              e.fullName || `${e.firstName || ""} ${e.lastName || ""}`.trim(),
              e.department,
              e.position,
              e.phoneNumber || "—",
              e.email || "—",
              e.status,
            ])}
            className="px-3.5 py-2 bg-slate-700/60 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-600 transition-all cursor-pointer whitespace-nowrap"
          />

          {/* Create Employee Button */}
          {(userRole === "ADMIN" || userRole === "HR") && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 bg-brand-gold hover:bg-yellow-500 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center space-x-2 whitespace-nowrap cursor-pointer"
            >
              <i className="fas fa-user-plus"></i>
              <span>Register Employee</span>
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex justify-between items-center">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Employee Data Table */}
      <DataTable
        columns={[
          {
            key: "employeeId",
            label: "Employee ID",
            render: (v, row) => (
              <span className="font-mono text-brand-gold font-semibold cursor-pointer hover:underline" onClick={() => setSelectedEmp(row as unknown as EmployeeItem)}>
                {v as string}
              </span>
            ),
          },
          {
            key: "fullName",
            label: "Full Name",
            render: (v, row) => (
              <div>
                <div className="font-semibold text-white">{v as string}</div>
                {(row as unknown as EmployeeItem).email && <div className="text-xs text-gray-400">{(row as unknown as EmployeeItem).email}</div>}
              </div>
            ),
          },
          { key: "phone", label: "Phone", render: (v) => (v ? <span className="text-gray-300">{v as string}</span> : <span className="text-gray-500 italic">None</span>) },
          { key: "department", label: "Department" },
          { key: "position", label: "Position" },
          {
            key: "account",
            label: "Account",
            render: (v, row) => {
              const u = (row as unknown as EmployeeItem).user;
              return u ? (
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  {u.userId} ({u.role})
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-gray-400">No Account</span>
              );
            },
          },
          { key: "status", label: "Status", render: (v) => <StatusBadge status={v as string} /> },
          {
            key: "actions",
            label: "Actions",
            render: (_, row) => (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedEmp(row as unknown as EmployeeItem)}
                  className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-gray-200 rounded-lg text-xs font-semibold"
                >
                  Details
                </button>
                {(userRole === "ADMIN" || userRole === "HR") && (
                  <button
                    onClick={() => toggleStatus(row as unknown as EmployeeItem)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      (row as unknown as EmployeeItem).status === "ACTIVE"
                        ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                    }`}
                  >
                    {(row as unknown as EmployeeItem).status === "ACTIVE" ? "Deactivate" : "Activate"}
                  </button>
                )}
              </div>
            ),
          },
        ]}
        data={filteredEmployees.map((e) => ({
          ...e,
          employeeId: e.employeeId || e.user?.userId || `EMP-${e.id}`,
          fullName: e.fullName || `${e.firstName || ""} ${e.lastName || ""}`.trim() || e.user?.name || "N/A",
          phone: e.phoneNumber,
        }))}
        emptyMessage="No employees registered yet."
      />

      {/* Employee Details Modal */}
      {selectedEmp && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-start border-b border-slate-700 pb-4">
              <div>
                <span className="text-xs font-mono text-brand-gold uppercase tracking-wider">
                  {selectedEmp.employeeId || `EMP-${selectedEmp.id}`}
                </span>
                <h2 className="text-xl font-extrabold text-white mt-1">
                  {selectedEmp.fullName || `${selectedEmp.firstName || ""} ${selectedEmp.lastName || ""}`.trim()}
                </h2>
                <p className="text-sm text-gray-400">{selectedEmp.position} — {selectedEmp.department}</p>
              </div>
              <button onClick={() => setSelectedEmp(null)} className="text-gray-400 hover:text-white p-2">
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            {/* Personal Information */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Personal Information</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-900/60 p-4 rounded-xl">
                <div>
                  <div className="text-xs text-gray-500">Gender</div>
                  <div className="text-sm text-white font-medium">{selectedEmp.gender || "Not specified"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Date of Birth</div>
                  <div className="text-sm text-white font-medium">
                    {selectedEmp.dateOfBirth
                      ? new Date(selectedEmp.dateOfBirth).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "Not specified"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Employment Status</div>
                  <StatusBadge status={selectedEmp.status} />
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/60 p-4 rounded-xl">
                <div>
                  <div className="text-xs text-gray-500">Phone Number</div>
                  <div className="text-sm text-white font-semibold">{selectedEmp.phoneNumber || "Not recorded"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Alternate Phone</div>
                  <div className="text-sm text-gray-300">{selectedEmp.alternatePhoneNumber || "None"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Email Address</div>
                  <div className="text-sm text-white font-medium">{selectedEmp.email || "Not recorded"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Address / City</div>
                  <div className="text-sm text-gray-300">{selectedEmp.address ? `${selectedEmp.address}, ${selectedEmp.city || ""}` : "Not recorded"}</div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Emergency Contact</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/60 p-4 rounded-xl">
                <div>
                  <div className="text-xs text-gray-500">Contact Name</div>
                  <div className="text-sm text-white font-medium">{selectedEmp.emergencyContactName || "None"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Relationship</div>
                  <div className="text-sm text-gray-300">{selectedEmp.emergencyContactRelationship || "N/A"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Emergency Phone</div>
                  <div className="text-sm text-brand-gold font-semibold">{selectedEmp.emergencyContactPhone || "N/A"}</div>
                </div>
              </div>
            </div>

            {/* System Account & Driver Status */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">System Integration</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/60 p-4 rounded-xl">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Authentication Account</div>
                  {selectedEmp.user ? (
                    <div className="text-sm text-emerald-400 font-mono font-semibold">
                      User ID: {selectedEmp.user.userId} ({selectedEmp.user.role})
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 italic">No System Account</div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Driver License Profile</div>
                  {selectedEmp.driver ? (
                    <div className="text-sm text-brand-gold font-mono font-semibold">
                      License: {selectedEmp.driver.licenseNumber}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 italic">Not a registered driver</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Employee Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-700 pb-4">
              <h3 className="text-lg font-bold text-white">Register New Employee</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-white">
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}

            <form onSubmit={handleCreateEmployee} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-brand-gold uppercase tracking-wider">1. Personal Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">First Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Middle Name</label>
                    <input
                      type="text"
                      value={formData.middleName}
                      onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Employee ID (Optional Auto-Gen)</label>
                    <input
                      type="text"
                      placeholder="e.g. EMP-001"
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-brand-gold uppercase tracking-wider">2. Contact Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+251 91 123 4567"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Alternate Phone</label>
                    <input
                      type="text"
                      value={formData.alternatePhoneNumber}
                      onChange={(e) => setFormData({ ...formData, alternatePhoneNumber: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Email Address</label>
                    <input
                      type="email"
                      placeholder="name@ppa.gov.et"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                </div>
              </div>

              {/* Employment Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-brand-gold uppercase tracking-wider">3. Employment Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Department *</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
                    >
                      <option value="Transport & Fleet Operations">Transport & Fleet Operations</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Fuel Management">Fuel Management</option>
                      <option value="Administration">Administration</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Job Title / Position *</label>
                    <input
                      type="text"
                      required
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Employment Type</label>
                    <select
                      value={formData.employmentType}
                      onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
                    >
                      <option value="FULL_TIME">Full Time</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="PART_TIME">Part Time</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* System Account Toggle */}
              <div className="p-4 bg-slate-900/80 border border-slate-700 rounded-xl space-y-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.createSystemAccount}
                    onChange={(e) => setFormData({ ...formData, createSystemAccount: e.target.checked })}
                    className="w-4 h-4 text-brand-gold rounded border-slate-700 bg-slate-900 focus:ring-brand-gold"
                  />
                  <div>
                    <div className="text-sm font-bold text-white">Create System Login Account</div>
                    <div className="text-xs text-gray-400">Allows this employee to sign into FMS with a User ID & Password</div>
                  </div>
                </label>

                {formData.createSystemAccount && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">User ID *</label>
                      <input
                        type="text"
                        required={formData.createSystemAccount}
                        placeholder="e.g. 4270"
                        value={formData.accountUserId}
                        onChange={(e) => setFormData({ ...formData, accountUserId: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Password *</label>
                      <input
                        type="password"
                        required={formData.createSystemAccount}
                        placeholder="Initial password"
                        value={formData.accountPassword}
                        onChange={(e) => setFormData({ ...formData, accountPassword: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Role *</label>
                      <select
                        value={formData.accountRole}
                        onChange={(e) => setFormData({ ...formData, accountRole: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
                      >
                        <option value="DRIVER">Driver</option>
                        <option value="TRANSPORT_MANAGER">Transport Manager</option>
                        <option value="FLEET_MANAGER">Fleet Manager</option>
                        <option value="MECHANIC">Mechanic</option>
                        <option value="FUEL_CONTROLLER">Fuel Controller</option>
                        <option value="HR">HR</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                  </div>
                )}
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
                  disabled={isLoading}
                  className="px-5 py-2 bg-brand-gold hover:bg-yellow-500 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md"
                >
                  {isLoading ? "Saving..." : "Save Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
