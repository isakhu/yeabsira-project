import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import KPICard from "@/components/dashboard/KPICard";
import DataTable from "@/components/dashboard/DataTable";
import StatusBadge from "@/components/dashboard/StatusBadge";

import { AddMaintenanceButton } from "@/components/dashboard/CreateActionButtons";

export default async function MechanicDashboard() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/signin");
  if (session.role !== "ADMIN" && session.role !== "MECHANIC") redirect("/forbidden");

  const [serviceDue, repairJobs, inGarage, completedRepairs] = await Promise.all([
    prisma.vehicleService.count({ where: { status: { in: ["SCHEDULED", "OVERDUE"] } } }),
    prisma.maintenanceJob.count({ where: { status: { in: ["PENDING", "IN_PROGRESS"] } } }),
    prisma.vehicle.count({ where: { status: "GARAGE" } }),
    prisma.maintenanceJob.count({ where: { status: "COMPLETED" } }),
  ]);

  // Work queue
  const workQueue = await prisma.maintenanceJob.findMany({
    where: { status: { in: ["PENDING", "IN_PROGRESS"] } },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    include: { vehicle: { select: { registration: true, type: true } } },
  });

  // Service schedule
  const serviceSchedule = await prisma.vehicleService.findMany({
    where: { status: { in: ["SCHEDULED", "OVERDUE"] } },
    orderBy: { dueDate: "asc" },
    take: 8,
    include: { vehicle: { select: { registration: true } } },
  });

  // Diagnostics -- vehicles needing attention
  const criticalFaults = await prisma.maintenanceJob.count({ where: { priority: "CRITICAL", status: { not: "COMPLETED" } } });
  const highPriority = await prisma.maintenanceJob.count({ where: { priority: "HIGH", status: { not: "COMPLETED" } } });

  // Priority sort helper
  const priorityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Mechanic Dashboard</h1>
          <p className="text-gray-400 mt-1">Maintenance work queue, vehicle diagnostics, and service tasks</p>
        </div>
        <AddMaintenanceButton />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Service Due" value={serviceDue} icon="fas fa-wrench" color="orange" />
        <KPICard title="Repair Jobs" value={repairJobs} icon="fas fa-tools" color="red" />
        <KPICard title="Vehicles in Garage" value={inGarage} icon="fas fa-warehouse" color="blue" />
        <KPICard title="Completed Repairs" value={completedRepairs} icon="fas fa-check-circle" color="green" />
      </div>

      {/* Work Queue */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Maintenance Work Queue</h3>
        <DataTable
          columns={[
            { key: "vehicle", label: "Vehicle", render: (v) => <span className="font-mono text-brand-gold">{v as string}</span> },
            { key: "problem", label: "Problem" },
            { key: "priority", label: "Priority", render: (v) => <StatusBadge status={v as string} /> },
            { key: "date", label: "Date" },
            { key: "status", label: "Status", render: (v) => <StatusBadge status={v as string} /> },
          ]}
          data={workQueue
            .sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9))
            .map((j) => ({
              vehicle: j.vehicle.registration,
              problem: j.problem,
              priority: j.priority,
              date: new Date(j.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              status: j.status,
            }))}
          emptyMessage="No pending maintenance jobs"
        />
      </div>

      {/* Service Schedule + Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Schedule */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Service Schedule</h3>
          <div className="bg-slate-800 border border-slate-600 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-600">
                    {["Vehicle", "Service Type", "Due Date", "Status"].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {serviceSchedule.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-brand-gold">{s.vehicle.registration}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{s.serviceType}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {new Date(s.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={s.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Diagnostics */}
        <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Diagnostics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-red-400"></i>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Critical Faults</div>
                  <div className="text-xs text-gray-400">Require immediate attention</div>
                </div>
              </div>
              <span className="text-2xl font-bold text-red-400">{criticalFaults}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <i className="fas fa-exclamation-circle text-orange-400"></i>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">High Priority</div>
                  <div className="text-xs text-gray-400">Needs scheduling soon</div>
                </div>
              </div>
              <span className="text-2xl font-bold text-orange-400">{highPriority}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <i className="fas fa-clipboard-check text-blue-400"></i>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Scheduled Checkups</div>
                  <div className="text-xs text-gray-400">Upcoming routine inspections</div>
                </div>
              </div>
              <span className="text-2xl font-bold text-blue-400">{serviceDue}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
