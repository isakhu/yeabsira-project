import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import KPICard from "@/components/dashboard/KPICard";
import DataTable from "@/components/dashboard/DataTable";
import StatusBadge from "@/components/dashboard/StatusBadge";
import Link from "next/link";

export default async function HRDashboard() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/signin");
  if (session.role !== "ADMIN" && session.role !== "HR") redirect("/forbidden");

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const [
    totalEmployees,
    activeEmployees,
    inactiveEmployees,
    totalDrivers,
    activeDrivers,
    assignedDrivers,
    availableDrivers,
    expiringLicenses,
  ] = await Promise.all([
    prisma.employee.count(),
    prisma.employee.count({ where: { status: "ACTIVE" } }),
    prisma.employee.count({ where: { status: { in: ["INACTIVE", "TERMINATED", "ON_LEAVE"] } } }),
    prisma.driver.count(),
    prisma.driver.count({ where: { status: "ACTIVE" } }),
    prisma.driver.count({ where: { assignedVehicleId: { not: null } } }),
    prisma.driver.count({ where: { status: "ACTIVE", assignedVehicleId: null } }),
    prisma.driver.count({ where: { licenseExpiry: { lte: thirtyDaysFromNow } } }),
  ]);

  const employees = await prisma.employee.findMany({
    include: {
      user: { select: { userId: true, name: true, role: true, active: true } },
      driver: { select: { driverId: true, licenseNumber: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const behavior = await prisma.driverBehavior.aggregate({
    _sum: { speedEvents: true, harshBraking: true, highRPM: true, acceleration: true },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">HR Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Personnel records, driver license compliance, and driver safety oversight
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/hr/employees"
            className="px-4 py-2 bg-brand-gold hover:bg-yellow-500 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg flex items-center space-x-2"
          >
            <i className="fas fa-users"></i>
            <span>Employee Directory</span>
          </Link>
          <Link
            href="/hr/drivers"
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl text-sm transition-all border border-slate-600 flex items-center space-x-2"
          >
            <i className="fas fa-id-card"></i>
            <span>Driver Registry</span>
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Employees" value={totalEmployees} icon="fas fa-users" color="gold" />
        <KPICard title="Active Employees" value={activeEmployees} icon="fas fa-user-check" color="green" />
        <KPICard title="Total Drivers" value={totalDrivers} icon="fas fa-id-card" color="blue" />
        <KPICard title="Expiring Licenses" value={expiringLicenses} icon="fas fa-exclamation-triangle" color="orange" />
      </div>

      {/* Employee Directory + Driver Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Recent Personnel Records</h3>
            <Link href="/hr/employees" className="text-xs text-brand-gold hover:underline">
              View All Employees &rarr;
            </Link>
          </div>
          <DataTable
            columns={[
              {
                key: "employeeId",
                label: "ID",
                render: (v) => <span className="font-mono text-brand-gold">{v as string}</span>,
              },
              { key: "name", label: "Full Name" },
              { key: "department", label: "Department" },
              { key: "position", label: "Position" },
              {
                key: "hasAccount",
                label: "Account",
                render: (v) =>
                  v ? (
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Yes</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-gray-400">No Account</span>
                  ),
              },
              { key: "status", label: "Status", render: (v) => <StatusBadge status={v as string} /> },
            ]}
            data={employees.map((e) => ({
              employeeId: e.employeeId || e.user?.userId || `EMP-${e.id}`,
              name: e.fullName || `${e.firstName || ""} ${e.lastName || ""}`.trim() || e.user?.name || "N/A",
              department: e.department,
              position: e.position,
              hasAccount: !!e.user,
              status: e.status,
            }))}
            emptyMessage="No personnel records registered yet."
          />
        </div>

        {/* Driver Status Breakdown */}
        <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white mb-2">Driver Operational Status</h3>
          <div className="space-y-3">
            {[
              { label: "Active Drivers", value: activeDrivers, color: "text-emerald-400", icon: "fas fa-user-check" },
              { label: "Assigned Drivers", value: assignedDrivers, color: "text-blue-400", icon: "fas fa-id-card" },
              { label: "Available Drivers", value: availableDrivers, color: "text-yellow-400", icon: "fas fa-user-clock" },
              { label: "Inactive / Suspended", value: totalDrivers - activeDrivers, color: "text-red-400", icon: "fas fa-user-minus" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl border border-slate-700">
                <div className="flex items-center space-x-3">
                  <i className={`${item.icon} ${item.color}`}></i>
                  <span className="text-sm text-gray-300">{item.label}</span>
                </div>
                <span className="text-xl font-bold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Driver Behavior Summary */}
      <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Institutional Driver Behavior Telematics</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Speed Events", value: behavior._sum.speedEvents || 0, color: "text-red-400", icon: "fas fa-tachometer-alt" },
            { label: "Harsh Braking", value: behavior._sum.harshBraking || 0, color: "text-orange-400", icon: "fas fa-stop-circle" },
            { label: "High RPM Events", value: behavior._sum.highRPM || 0, color: "text-yellow-400", icon: "fas fa-gauge-high" },
            { label: "Harsh Acceleration", value: behavior._sum.acceleration || 0, color: "text-purple-400", icon: "fas fa-forward" },
          ].map((item) => (
            <div key={item.label} className="text-center p-4 bg-slate-700/50 rounded-xl border border-slate-700">
              <i className={`${item.icon} ${item.color} text-2xl mb-2`}></i>
              <div className="text-2xl font-bold text-white">{item.value}</div>
              <div className="text-xs text-gray-400 mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
