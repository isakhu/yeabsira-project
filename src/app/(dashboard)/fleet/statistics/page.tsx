import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  StatMetricCard,
  BarChartCard,
  ProgressRingGauge,
  EmptyStatisticsState,
  CSVExportButton,
} from "@/components/dashboard/StatisticsCharts";
import DataTable from "@/components/dashboard/DataTable";

export default async function FleetStatisticsPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/signin");
  if (session.role !== "FLEET_MANAGER" && session.role !== "ADMIN") redirect("/forbidden");

  const [
    totalFleet,
    activeVehicles,
    idleVehicles,
    fieldWorkVehicles,
    garageVehicles,
    oosVehicles,
    vehiclesByType,
    vehiclesByFuel,
    mileageStats,
    topMileageVehicles,
    maintWorkload,
    serviceDue,
    serviceCompleted,
    maintByPriority,
  ] = await Promise.all([
    prisma.vehicle.count(),
    prisma.vehicle.count({ where: { status: { not: "OUT_OF_SERVICE" } } }),
    prisma.vehicle.count({ where: { status: "IDLE" } }),
    prisma.vehicle.count({ where: { status: "FIELD_WORK" } }),
    prisma.vehicle.count({ where: { status: "GARAGE" } }),
    prisma.vehicle.count({ where: { status: "OUT_OF_SERVICE" } }),
    prisma.vehicle.groupBy({ by: ["type"], _count: { _all: true } }),
    prisma.vehicle.groupBy({ by: ["fuelType"], _count: { _all: true } }),
    prisma.vehicle.aggregate({
      _avg: { mileage: true },
      _max: { mileage: true },
      _min: { mileage: true },
    }),
    prisma.vehicle.findMany({
      orderBy: { mileage: "desc" },
      take: 5,
      select: { registration: true, make: true, model: true, mileage: true, status: true },
    }),
    prisma.maintenanceJob.count({ where: { status: { in: ["PENDING", "IN_PROGRESS"] } } }),
    prisma.vehicleService.count({ where: { status: { in: ["SCHEDULED", "OVERDUE"] } } }),
    prisma.vehicleService.count({ where: { status: "COMPLETED" } }),
    prisma.maintenanceJob.groupBy({ by: ["priority"], _count: { _all: true } }),
  ]);

  const maintPriorityMap = Object.fromEntries(maintByPriority.map((m) => [m.priority, m._count._all]));

  // Safely calculate rates
  const availabilityPct = totalFleet > 0 ? (activeVehicles / totalFleet) * 100 : null;
  const utilizationPct = totalFleet > 0 ? (fieldWorkVehicles / totalFleet) * 100 : null;
  const serviceCompliancePct = (serviceCompleted + serviceDue) > 0
    ? (serviceCompleted / (serviceCompleted + serviceDue)) * 100
    : null;

  const avgMileageDisplay = mileageStats._avg.mileage !== null
    ? `${Math.round(mileageStats._avg.mileage).toLocaleString()} km`
    : "Insufficient data";

  const csvHeaders = ["Category", "Metric", "Value"];
  const csvRows = [
    ["Fleet", "Total Fleet", totalFleet],
    ["Fleet", "Active Vehicles", activeVehicles],
    ["Fleet", "Idle Vehicles", idleVehicles],
    ["Fleet", "Field Work Vehicles", fieldWorkVehicles],
    ["Fleet", "Garage Vehicles", garageVehicles],
    ["Fleet", "Out of Service", oosVehicles],
    ["Fleet", "Availability Rate", availabilityPct !== null ? `${availabilityPct.toFixed(1)}%` : "Insufficient data"],
    ["Fleet", "Utilization Rate", utilizationPct !== null ? `${utilizationPct.toFixed(1)}%` : "Insufficient data"],
    ["Fleet", "Average Mileage", avgMileageDisplay],
    ["Maintenance", "Pending Workload", maintWorkload],
    ["Maintenance", "Services Due", serviceDue],
    ["Maintenance", "Services Completed", serviceCompleted],
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Fleet Utilization & Maintenance Analytics
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Operational vehicle availability, mileage distribution, and service health metrics.
          </p>
        </div>
        <CSVExportButton
          filename="FMS_Fleet_Management_Statistics"
          reportName="Fleet Management Statistics"
          headers={csvHeaders}
          rows={csvRows}
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatMetricCard
          title="Total Fleet Size"
          value={totalFleet}
          subtitle={`${activeVehicles} vehicles operational`}
          icon="fas fa-truck"
          color="gold"
        />
        <StatMetricCard
          title="Vehicle Availability"
          value={availabilityPct !== null ? `${Math.round(availabilityPct)}%` : "Insufficient data"}
          subtitle={`${idleVehicles + fieldWorkVehicles} ready / deployed`}
          icon="fas fa-check-circle"
          color="green"
        />
        <StatMetricCard
          title="Active Maintenance Workload"
          value={maintWorkload}
          subtitle={`${garageVehicles} currently in garage`}
          icon="fas fa-tools"
          color="orange"
        />
        <StatMetricCard
          title="Average Fleet Mileage"
          value={avgMileageDisplay}
          subtitle={mileageStats._max.mileage !== null ? `Max: ${mileageStats._max.mileage.toLocaleString()} km` : undefined}
          icon="fas fa-tachometer-alt"
          color="blue"
        />
      </div>

      {/* Rates & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ProgressRingGauge
          title="Vehicle Availability Rate"
          subtitle="Percentage of fleet in active service condition"
          percentage={availabilityPct}
          color="green"
        />

        <ProgressRingGauge
          title="Fleet Utilization Rate"
          subtitle="Percentage of vehicles deployed on field work"
          percentage={utilizationPct}
          color="gold"
        />

        <ProgressRingGauge
          title="Service Compliance Index"
          subtitle="Ratio of completed vs pending services"
          percentage={serviceCompliancePct}
          color="blue"
        />
      </div>

      {/* Status & Maintenance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BarChartCard
          title="Vehicle Operational Status"
          subtitle="Fleet status categorization"
          items={[
            { label: "Idle", value: idleVehicles, color: "bg-blue-500" },
            { label: "Field Work", value: fieldWorkVehicles, color: "bg-emerald-500" },
            { label: "Garage", value: garageVehicles, color: "bg-amber-500" },
            { label: "Out of Service", value: oosVehicles, color: "bg-red-500" },
          ]}
        />

        <BarChartCard
          title="Vehicle Types Breakdown"
          subtitle="Distribution across vehicle body classes"
          items={vehiclesByType.map((v) => ({
            label: v.type,
            value: v._count._all,
            color: "bg-purple-500",
          }))}
          emptyMessage="No vehicles registered yet."
        />

        <BarChartCard
          title="Maintenance Priority Distribution"
          subtitle="Open repair tasks by priority"
          items={[
            { label: "Critical Priority", value: maintPriorityMap["CRITICAL"] || 0, color: "bg-red-500" },
            { label: "High Priority", value: maintPriorityMap["HIGH"] || 0, color: "bg-orange-500" },
            { label: "Medium Priority", value: maintPriorityMap["MEDIUM"] || 0, color: "bg-amber-500" },
            { label: "Low Priority", value: maintPriorityMap["LOW"] || 0, color: "bg-blue-500" },
          ]}
        />
      </div>

      {/* High Mileage Vehicles Leaderboard */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Highest Mileage Vehicles</h3>
        {topMileageVehicles.length === 0 ? (
          <EmptyStatisticsState
            title="No vehicles in database"
            message="Registered fleet vehicles will appear here with their odometer readings."
          />
        ) : (
          <DataTable
            columns={[
              { key: "registration", label: "Registration" },
              { key: "makeModel", label: "Make & Model", render: (_, item: any) => `${item.make} ${item.model}` },
              { key: "mileage", label: "Odometer Reading", render: (v) => <span className="font-bold text-brand-gold">{Number(v).toLocaleString()} km</span> },
              { key: "status", label: "Current Status", render: (v) => <span className="text-gray-300 font-medium">{String(v)}</span> },
            ]}
            data={topMileageVehicles}
            emptyMessage="No vehicle records found."
          />
        )}
      </div>
    </div>
  );
}
