import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import KPICard from "@/components/dashboard/KPICard";
import DataTable from "@/components/dashboard/DataTable";
import StatusBadge from "@/components/dashboard/StatusBadge";

import { AddVehicleButton, AddBookingButton, AddMaintenanceButton, AddFuelButton, AddUserButton } from "@/components/dashboard/CreateActionButtons";

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/signin");
  if (session.role !== "ADMIN") redirect("/forbidden");

  // Fetch aggregated data
  const [
    totalVehicles,
    activeVehicles,
    maintenanceVehicles,
    oosVehicles,
    idleVehicles,
    fieldWorkVehicles,
    garageVehicles,
    pendingBookings,
    approvedBookings,
    completedBookings,
    serviceDue,
    pendingRepairs,
    todayFuel,
    monthlyFuel,
    recentActivity,
    driverBehavior,
  ] = await Promise.all([
    prisma.vehicle.count(),
    prisma.vehicle.count({ where: { status: { not: "OUT_OF_SERVICE" } } }),
    prisma.vehicle.count({ where: { status: "GARAGE" } }),
    prisma.vehicle.count({ where: { status: "OUT_OF_SERVICE" } }),
    prisma.vehicle.count({ where: { status: "IDLE" } }),
    prisma.vehicle.count({ where: { status: "FIELD_WORK" } }),
    prisma.vehicle.count({ where: { status: "GARAGE" } }),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.booking.count({ where: { status: "APPROVED" } }),
    prisma.booking.count({ where: { status: "COMPLETED" } }),
    prisma.vehicleService.count({ where: { status: { in: ["SCHEDULED", "OVERDUE"] } } }),
    prisma.maintenanceJob.count({ where: { status: "PENDING" } }),
    prisma.fuelTransaction.aggregate({
      _sum: { quantity: true },
      where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
    prisma.fuelTransaction.aggregate({
      _sum: { quantity: true, cost: true },
      where: {
        date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
    prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 8,
      include: { user: { select: { name: true, role: true } } },
    }),
    prisma.driverBehavior.aggregate({
      _sum: { speedEvents: true, harshBraking: true, highRPM: true },
    }),
  ]);

  const activityData = recentActivity.map((log) => ({
    time: new Date(log.timestamp).toLocaleString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    }),
    user: log.user?.name || log.userId,
    action: log.action.replace(/_/g, " "),
    target: log.target || "—",
  }));

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            Fleet Management System — Administration
          </h1>
          <p className="text-gray-400 mt-1">Welcome, Administrator</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AddVehicleButton />
          <AddBookingButton />
          <AddMaintenanceButton />
          <AddFuelButton />
          <AddUserButton />
        </div>
      </div>

      {/* Fleet KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Vehicles" value={totalVehicles} icon="fas fa-truck" color="gold" />
        <KPICard title="Active Vehicles" value={activeVehicles} icon="fas fa-check-circle" color="green" />
        <KPICard title="Vehicles in Maintenance" value={maintenanceVehicles} icon="fas fa-tools" color="orange" />
        <KPICard title="Out of Service" value={oosVehicles} icon="fas fa-ban" color="red" />
      </div>

      {/* Vehicle Status + Transport/Booking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle Status */}
        <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Vehicle Status Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Idle", value: idleVehicles, color: "text-blue-400", icon: "fas fa-pause-circle" },
              { label: "Field Work", value: fieldWorkVehicles, color: "text-emerald-400", icon: "fas fa-road" },
              { label: "Garage", value: garageVehicles, color: "text-orange-400", icon: "fas fa-warehouse" },
              { label: "Out of Service", value: oosVehicles, color: "text-red-400", icon: "fas fa-times-circle" },
            ].map((item) => (
              <div key={item.label} className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-xl">
                <i className={`${item.icon} ${item.color} text-lg`}></i>
                <div>
                  <div className="text-xl font-bold text-white">{item.value}</div>
                  <div className="text-xs text-gray-400">{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transport / Booking */}
        <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Transport / Booking</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Pending Requests", value: pendingBookings, color: "text-yellow-400" },
              { label: "Approved Requests", value: approvedBookings, color: "text-emerald-400" },
              { label: "Completed Requests", value: completedBookings, color: "text-blue-400" },
            ].map((item) => (
              <div key={item.label} className="text-center p-4 bg-slate-700/50 rounded-xl">
                <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                <div className="text-xs text-gray-400 mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Maintenance + Fuel + Driver Behavior */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Maintenance */}
        <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Maintenance</h3>
          <div className="space-y-3">
            {[
              { label: "Service Due", value: serviceDue, icon: "fas fa-wrench", color: "text-yellow-400" },
              { label: "Pending Repairs", value: pendingRepairs, icon: "fas fa-hammer", color: "text-orange-400" },
              { label: "Vehicles in Garage", value: garageVehicles, icon: "fas fa-warehouse", color: "text-blue-400" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <i className={`${item.icon} ${item.color}`}></i>
                  <span className="text-sm text-gray-300">{item.label}</span>
                </div>
                <span className="text-lg font-bold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fuel */}
        <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Fuel</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl">
              <span className="text-sm text-gray-300">Today&apos;s Consumption</span>
              <span className="text-lg font-bold text-brand-gold">{todayFuel._sum.quantity?.toFixed(0) || 0}L</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl">
              <span className="text-sm text-gray-300">Monthly Consumption</span>
              <span className="text-lg font-bold text-blue-400">{monthlyFuel._sum.quantity?.toFixed(0) || 0}L</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl">
              <span className="text-sm text-gray-300">Monthly Cost</span>
              <span className="text-lg font-bold text-emerald-400">ETB {monthlyFuel._sum.cost?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>

        {/* Driver Behavior */}
        <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Driver Behavior</h3>
          <div className="space-y-3">
            {[
              { label: "Speed Events", value: driverBehavior._sum.speedEvents || 0, color: "text-red-400", icon: "fas fa-tachometer-alt" },
              { label: "Harsh Braking", value: driverBehavior._sum.harshBraking || 0, color: "text-orange-400", icon: "fas fa-stop-circle" },
              { label: "High RPM Events", value: driverBehavior._sum.highRPM || 0, color: "text-yellow-400", icon: "fas fa-gauge-high" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <i className={`${item.icon} ${item.color}`}></i>
                  <span className="text-sm text-gray-300">{item.label}</span>
                </div>
                <span className="text-lg font-bold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Recent System Activity</h3>
        <DataTable
          columns={[
            { key: "time", label: "Time" },
            { key: "user", label: "User" },
            { key: "action", label: "Action", render: (v) => (
              <span className="text-brand-gold font-medium">{v as string}</span>
            )},
            { key: "target", label: "Target" },
          ]}
          data={activityData}
          emptyMessage="No recent activity"
        />
      </div>
    </div>
  );
}
