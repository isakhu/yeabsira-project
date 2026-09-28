import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import KPICard from "@/components/dashboard/KPICard";
import StatusBadge from "@/components/dashboard/StatusBadge";

import { AddVehicleButton } from "@/components/dashboard/CreateActionButtons";

export default async function FleetDashboard() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/signin");
  if (session.role !== "ADMIN" && session.role !== "FLEET_MANAGER") redirect("/forbidden");

  const [
    totalFleet, available, inGarage, oos,
    idle, fieldWork,
    serviceDueSoon, overdueService,
    underRepair, pendingRepairs, completedRepairs,
    behavior,
  ] = await Promise.all([
    prisma.vehicle.count(),
    prisma.vehicle.count({ where: { status: "IDLE" } }),
    prisma.vehicle.count({ where: { status: "GARAGE" } }),
    prisma.vehicle.count({ where: { status: "OUT_OF_SERVICE" } }),
    prisma.vehicle.count({ where: { status: "IDLE" } }),
    prisma.vehicle.count({ where: { status: "FIELD_WORK" } }),
    prisma.vehicleService.count({ where: { status: "SCHEDULED" } }),
    prisma.vehicleService.count({ where: { status: "OVERDUE" } }),
    prisma.maintenanceJob.count({ where: { status: "IN_PROGRESS" } }),
    prisma.maintenanceJob.count({ where: { status: "PENDING" } }),
    prisma.maintenanceJob.count({ where: { status: "COMPLETED" } }),
    prisma.driverBehavior.aggregate({ _sum: { speedEvents: true, harshBraking: true, highRPM: true } }),
  ]);

  // Recent vehicles
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Fleet Manager Dashboard</h1>
          <p className="text-gray-400 mt-1">Fleet monitoring, vehicle service, and maintenance oversight</p>
        </div>
        <AddVehicleButton />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Fleet" value={totalFleet} icon="fas fa-truck" color="gold" />
        <KPICard title="Available Vehicles" value={available} icon="fas fa-check-circle" color="green" />
        <KPICard title="Vehicles in Garage" value={inGarage} icon="fas fa-warehouse" color="orange" />
        <KPICard title="Out of Service" value={oos} icon="fas fa-ban" color="red" />
      </div>

      {/* Vehicle Status + Vehicle Service */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Vehicle Status</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Idle", value: idle, color: "text-blue-400", icon: "fas fa-pause-circle" },
              { label: "Field Work", value: fieldWork, color: "text-emerald-400", icon: "fas fa-road" },
              { label: "Garage", value: inGarage, color: "text-orange-400", icon: "fas fa-warehouse" },
              { label: "Out of Service", value: oos, color: "text-red-400", icon: "fas fa-times-circle" },
            ].map((item) => (
              <div key={item.label} className="flex items-center space-x-3 p-4 bg-slate-700/50 rounded-xl">
                <i className={`${item.icon} ${item.color} text-xl`}></i>
                <div>
                  <div className="text-2xl font-bold text-white">{item.value}</div>
                  <div className="text-xs text-gray-400">{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Vehicle Service</h3>
          <div className="space-y-3">
            {[
              { label: "Service Due Soon", value: serviceDueSoon, color: "text-yellow-400", icon: "fas fa-calendar-check" },
              { label: "Overdue Service", value: overdueService, color: "text-red-400", icon: "fas fa-exclamation-triangle" },
              { label: "Scheduled Inspections", value: serviceDueSoon, color: "text-blue-400", icon: "fas fa-clipboard-check" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl">
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

      {/* Maintenance + Driver Behavior */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Vehicle Maintenance</h3>
          <div className="space-y-3">
            {[
              { label: "Vehicles Under Repair", value: underRepair, color: "text-brand-gold", icon: "fas fa-tools" },
              { label: "Pending Repairs", value: pendingRepairs, color: "text-orange-400", icon: "fas fa-clock" },
              { label: "Completed Repairs", value: completedRepairs, color: "text-emerald-400", icon: "fas fa-check-circle" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <i className={`${item.icon} ${item.color}`}></i>
                  <span className="text-sm text-gray-300">{item.label}</span>
                </div>
                <span className="text-xl font-bold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Driver Behavior</h3>
          <div className="space-y-3">
            {[
              { label: "Speeding Events", value: behavior._sum.speedEvents || 0, color: "text-red-400", icon: "fas fa-tachometer-alt" },
              { label: "Harsh Braking", value: behavior._sum.harshBraking || 0, color: "text-orange-400", icon: "fas fa-stop-circle" },
              { label: "High RPM Events", value: behavior._sum.highRPM || 0, color: "text-yellow-400", icon: "fas fa-gauge-high" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl">
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

      {/* Fleet Table */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Fleet Overview</h3>
        <div className="bg-slate-800 border border-slate-600 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-600">
                  {["Registration", "Type", "Make / Model", "Mileage", "Status"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-brand-gold">{v.registration}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{v.type}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{v.make} {v.model}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{v.mileage.toLocaleString()} km</td>
                    <td className="px-6 py-4"><StatusBadge status={v.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
