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

export default async function AdminStatisticsPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/signin");
  if (session.role !== "ADMIN") redirect("/forbidden");

  // Query real Prisma metrics
  const [
    totalVehicles,
    activeVehicles,
    vehiclesByStatus,
    vehiclesByType,
    vehiclesByFuel,
    totalBookings,
    bookingsByStatus,
    totalAssignments,
    assignmentsByStatus,
    totalMaintenance,
    maintByPriority,
    maintByStatus,
    serviceDueCount,
    fuelAgg,
    totalEmployees,
    totalDrivers,
    activeEmployees,
    recentAudits,
  ] = await Promise.all([
    prisma.vehicle.count(),
    prisma.vehicle.count({ where: { status: { not: "OUT_OF_SERVICE" } } }),
    prisma.vehicle.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.vehicle.groupBy({ by: ["type"], _count: { _all: true } }),
    prisma.vehicle.groupBy({ by: ["fuelType"], _count: { _all: true } }),
    prisma.booking.count(),
    prisma.booking.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.assignment.count(),
    prisma.assignment.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.maintenanceJob.count(),
    prisma.maintenanceJob.groupBy({ by: ["priority"], _count: { _all: true } }),
    prisma.maintenanceJob.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.vehicleService.count({ where: { status: { in: ["SCHEDULED", "OVERDUE"] } } }),
    prisma.fuelTransaction.aggregate({
      _sum: { quantity: true, cost: true },
      _count: { id: true },
    }),
    prisma.employee.count(),
    prisma.driver.count(),
    prisma.employee.count({ where: { status: "ACTIVE" } }),
    prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 6,
      include: { user: { select: { name: true, role: true } } },
    }),
  ]);

  // Process Status maps
  const vehicleStatusMap = Object.fromEntries(vehiclesByStatus.map((v) => [v.status, v._count._all]));
  const bookingStatusMap = Object.fromEntries(bookingsByStatus.map((b) => [b.status, b._count._all]));
  const assignmentStatusMap = Object.fromEntries(assignmentsByStatus.map((a) => [a.status, a._count._all]));
  const maintPriorityMap = Object.fromEntries(maintByPriority.map((m) => [m.priority, m._count._all]));
  const maintStatusMap = Object.fromEntries(maintByStatus.map((m) => [m.status, m._count._all]));

  // Calculated metrics with Zero-Division Protection
  const completedBookings = bookingStatusMap["COMPLETED"] || 0;
  const approvedBookings = bookingStatusMap["APPROVED"] || 0;
  const totalDecidedBookings = completedBookings + approvedBookings + (bookingStatusMap["REJECTED"] || 0);

  const completionRatePct = totalBookings > 0 && totalDecidedBookings > 0
    ? (completedBookings / totalBookings) * 100
    : null;

  const totalFuelLiters = fuelAgg._sum.quantity || 0;
  const totalFuelCost = fuelAgg._sum.cost || 0;
  const avgCostPerLiterDisplay = totalFuelLiters > 0
    ? `ETB ${(totalFuelCost / totalFuelLiters).toFixed(2)}`
    : "Insufficient data";

  const totalFuelTx = fuelAgg._count.id || 0;

  // Prepare CSV Export dataset
  const csvHeaders = ["Category", "Metric", "Value"];
  const csvRows = [
    ["Fleet", "Total Vehicles", totalVehicles],
    ["Fleet", "Active Vehicles", activeVehicles],
    ["Fleet", "Idle Vehicles", vehicleStatusMap["IDLE"] || 0],
    ["Fleet", "Field Work Vehicles", vehicleStatusMap["FIELD_WORK"] || 0],
    ["Fleet", "Garage Vehicles", vehicleStatusMap["GARAGE"] || 0],
    ["Fleet", "Out of Service", vehicleStatusMap["OUT_OF_SERVICE"] || 0],
    ["Transport", "Total Bookings", totalBookings],
    ["Transport", "Pending Bookings", bookingStatusMap["PENDING"] || 0],
    ["Transport", "Approved Bookings", approvedBookings],
    ["Transport", "Completed Bookings", completedBookings],
    ["Transport", "Rejected Bookings", bookingStatusMap["REJECTED"] || 0],
    ["Transport", "Total Assignments", totalAssignments],
    ["Maintenance", "Total Maintenance Jobs", totalMaintenance],
    ["Maintenance", "Pending Jobs", maintStatusMap["PENDING"] || 0],
    ["Maintenance", "Service Due Count", serviceDueCount],
    ["Fuel", "Total Fuel Volume (L)", totalFuelLiters],
    ["Fuel", "Total Fuel Cost (ETB)", totalFuelCost],
    ["Fuel", "Average Cost per Liter", avgCostPerLiterDisplay],
    ["HR", "Total Employees", totalEmployees],
    ["HR", "Active Employees", activeEmployees],
    ["HR", "Total Drivers", totalDrivers],
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            System-Wide Statistics & Analytics
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Real-time aggregate operational intelligence across all FMS modules.
          </p>
        </div>
        <CSVExportButton
          filename="FMS_Executive_System_Statistics"
          reportName="Executive System Statistics"
          headers={csvHeaders}
          rows={csvRows}
        />
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatMetricCard
          title="Total Fleet Vehicles"
          value={totalVehicles}
          subtitle={`${activeVehicles} active in service`}
          icon="fas fa-truck"
          color="gold"
        />
        <StatMetricCard
          title="Transport Booking Requests"
          value={totalBookings}
          subtitle={`${bookingStatusMap["PENDING"] || 0} pending approval`}
          icon="fas fa-calendar-check"
          color="blue"
        />
        <StatMetricCard
          title="Total Fuel Spend"
          value={totalFuelCost > 0 ? `ETB ${totalFuelCost.toLocaleString()}` : 0}
          subtitle={`${totalFuelLiters.toFixed(0)} Liters total volume`}
          icon="fas fa-gas-pump"
          color="green"
        />
        <StatMetricCard
          title="Maintenance Workload"
          value={totalMaintenance}
          subtitle={`${serviceDueCount} services due / overdue`}
          icon="fas fa-tools"
          color="orange"
        />
      </div>

      {/* Visual Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BarChartCard
          title="Vehicle Status Distribution"
          subtitle="Breakdown of fleet operational availability"
          items={[
            { label: "Idle", value: vehicleStatusMap["IDLE"] || 0, color: "bg-blue-500" },
            { label: "Field Work", value: vehicleStatusMap["FIELD_WORK"] || 0, color: "bg-emerald-500" },
            { label: "Garage", value: vehicleStatusMap["GARAGE"] || 0, color: "bg-amber-500" },
            { label: "Out of Service", value: vehicleStatusMap["OUT_OF_SERVICE"] || 0, color: "bg-red-500" },
          ]}
        />

        <BarChartCard
          title="Booking Requests Breakdown"
          subtitle="Status distribution of transport requests"
          items={[
            { label: "Pending", value: bookingStatusMap["PENDING"] || 0, color: "bg-amber-500" },
            { label: "Approved", value: approvedBookings, color: "bg-emerald-500" },
            { label: "Completed", value: completedBookings, color: "bg-blue-500" },
            { label: "Rejected", value: bookingStatusMap["REJECTED"] || 0, color: "bg-red-500" },
          ]}
        />

        <ProgressRingGauge
          title="Booking Completion Rate"
          subtitle="Ratio of successfully completed transport trips"
          percentage={completionRatePct}
          color="blue"
        />
      </div>

      {/* Secondary Metrics: Vehicle & Fuel Types + Maintenance Priorities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BarChartCard
          title="Vehicle Types"
          subtitle="Fleet composition by vehicle body style"
          items={vehiclesByType.map((v) => ({
            label: v.type,
            value: v._count._all,
            color: "bg-purple-500",
          }))}
          emptyMessage="No vehicle records registered."
        />

        <BarChartCard
          title="Fuel Type Breakdown"
          subtitle="Fleet power source distribution"
          items={vehiclesByFuel.map((v) => ({
            label: v.fuelType,
            value: v._count._all,
            color: "bg-emerald-500",
          }))}
          emptyMessage="No vehicle fuel data."
        />

        <BarChartCard
          title="Maintenance Priority"
          subtitle="Job urgency levels recorded"
          items={[
            { label: "Critical", value: maintPriorityMap["CRITICAL"] || 0, color: "bg-red-500" },
            { label: "High", value: maintPriorityMap["HIGH"] || 0, color: "bg-orange-500" },
            { label: "Medium", value: maintPriorityMap["MEDIUM"] || 0, color: "bg-amber-500" },
            { label: "Low", value: maintPriorityMap["LOW"] || 0, color: "bg-blue-500" },
          ]}
        />
      </div>

      {/* Fuel Summary Metrics */}
      <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Fuel Financials & Volume Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-700/40 rounded-xl border border-slate-600/50">
            <div className="text-xs text-gray-400 uppercase font-semibold">Total Fuel Cost</div>
            <div className="text-xl font-bold text-emerald-400 mt-1">ETB {totalFuelCost.toLocaleString()}</div>
          </div>
          <div className="p-4 bg-slate-700/40 rounded-xl border border-slate-600/50">
            <div className="text-xs text-gray-400 uppercase font-semibold">Total Liters Issued</div>
            <div className="text-xl font-bold text-brand-gold mt-1">{totalFuelLiters.toFixed(1)} L</div>
          </div>
          <div className="p-4 bg-slate-700/40 rounded-xl border border-slate-600/50">
            <div className="text-xs text-gray-400 uppercase font-semibold">Average Cost per Liter</div>
            <div className="text-xl font-bold text-blue-400 mt-1">{avgCostPerLiterDisplay}</div>
          </div>
          <div className="p-4 bg-slate-700/40 rounded-xl border border-slate-600/50">
            <div className="text-xs text-gray-400 uppercase font-semibold">Total Transactions</div>
            <div className="text-xl font-bold text-purple-400 mt-1">{totalFuelTx}</div>
          </div>
        </div>
      </div>

      {/* Recent System Audit Log Activity */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Recent Audit & Security Logs</h3>
        {recentAudits.length === 0 ? (
          <EmptyStatisticsState
            title="No audit events recorded"
            message="Security and system audit logs will populate here as users log in and execute actions."
          />
        ) : (
          <DataTable
            columns={[
              {
                key: "time",
                label: "Timestamp",
                render: (_, item: any) =>
                  new Date(item.timestamp).toLocaleString("en-US", {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                  }),
              },
              {
                key: "user",
                label: "User",
                render: (_, item: any) => item.user?.name || item.userId,
              },
              {
                key: "action",
                label: "Action",
                render: (val) => (
                  <span className="font-semibold text-brand-gold">
                    {String(val).replace(/_/g, " ")}
                  </span>
                ),
              },
              { key: "target", label: "Target", render: (v) => String(v || "—") },
            ]}
            data={recentAudits}
            emptyMessage="No recent audit logs available."
          />
        )}
      </div>
    </div>
  );
}
