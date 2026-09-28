import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  StatMetricCard,
  BarChartCard,
  EmptyStatisticsState,
  CSVExportButton,
} from "@/components/dashboard/StatisticsCharts";
import DataTable from "@/components/dashboard/DataTable";

export default async function HRStatisticsPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/signin");
  if (session.role !== "HR" && session.role !== "ADMIN") redirect("/forbidden");

  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

  const [
    totalEmployees,
    activeEmployees,
    inactiveEmployees,
    totalDrivers,
    activeDrivers,
    assignedDrivers,
    unassignedDrivers,
    deptDistribution,
    posDistribution,
    driverBehaviorAgg,
    expiringLicenses,
  ] = await Promise.all([
    prisma.employee.count(),
    prisma.employee.count({ where: { status: "ACTIVE" } }),
    prisma.employee.count({ where: { status: "INACTIVE" } }),
    prisma.driver.count(),
    prisma.driver.count({ where: { status: "ACTIVE" } }),
    prisma.driver.count({ where: { assignedVehicleId: { not: null } } }),
    prisma.driver.count({ where: { assignedVehicleId: null } }),
    prisma.employee.groupBy({ by: ["department"], _count: { _all: true } }),
    prisma.employee.groupBy({ by: ["position"], _count: { _all: true } }),
    prisma.driverBehavior.aggregate({
      _sum: {
        speedEvents: true,
        harshBraking: true,
        highRPM: true,
        acceleration: true,
      },
      _count: { id: true },
    }),
    prisma.driver.findMany({
      where: { licenseExpiry: { lte: threeMonthsFromNow } },
      include: { user: { select: { name: true } } },
      take: 5,
    }),
  ]);

  const speedEvents = driverBehaviorAgg._sum.speedEvents || 0;
  const harshBraking = driverBehaviorAgg._sum.harshBraking || 0;
  const highRPM = driverBehaviorAgg._sum.highRPM || 0;
  const acceleration = driverBehaviorAgg._sum.acceleration || 0;

  const totalViolations = speedEvents + harshBraking + highRPM + acceleration;
  const totalBehaviorRecords = driverBehaviorAgg._count.id || 0;

  const safetyIndexDisplay = totalBehaviorRecords > 0
    ? `${totalViolations} total safety events`
    : "No behavior records";

  const csvHeaders = ["Category", "Metric", "Value"];
  const csvRows = [
    ["Workforce", "Total Employees", totalEmployees],
    ["Workforce", "Active Employees", activeEmployees],
    ["Workforce", "Inactive Employees", inactiveEmployees],
    ["Drivers", "Total Drivers", totalDrivers],
    ["Drivers", "Active Drivers", activeDrivers],
    ["Drivers", "Assigned Drivers", assignedDrivers],
    ["Drivers", "Unassigned Drivers", unassignedDrivers],
    ["Safety", "Speeding Events", speedEvents],
    ["Safety", "Harsh Braking Events", harshBraking],
    ["Safety", "High RPM Events", highRPM],
    ["Safety", "Rapid Acceleration Events", acceleration],
    ["Safety", "Total Behavior Incidents", totalViolations],
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Human Resources & Driver Behavior Analytics
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Workforce composition, driver vehicle assignment stats, and safety violation indexes.
          </p>
        </div>
        <CSVExportButton
          filename="FMS_HR_Personnel_Statistics"
          reportName="HR Personnel Statistics"
          headers={csvHeaders}
          rows={csvRows}
        />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatMetricCard
          title="Total Employees"
          value={totalEmployees}
          subtitle={`${activeEmployees} active workforce`}
          icon="fas fa-users"
          color="gold"
        />
        <StatMetricCard
          title="Total Registered Drivers"
          value={totalDrivers}
          subtitle={`${assignedDrivers} assigned to vehicles`}
          icon="fas fa-id-card"
          color="blue"
        />
        <StatMetricCard
          title="Unassigned Drivers"
          value={unassignedDrivers}
          subtitle={`${activeDrivers} active status drivers`}
          icon="fas fa-user-clock"
          color="orange"
        />
        <StatMetricCard
          title="Driver Safety Incidents"
          value={totalBehaviorRecords > 0 ? totalViolations : "No behavior records"}
          subtitle={`${totalBehaviorRecords} telemetry entries`}
          icon="fas fa-shield-alt"
          color="red"
        />
      </div>

      {/* Visual Charts: Department & Position & Safety */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BarChartCard
          title="Department Distribution"
          subtitle="Employee headcount by department"
          items={deptDistribution.map((d) => ({
            label: d.department || "General",
            value: d._count._all,
            color: "bg-purple-500",
          }))}
          emptyMessage="No department records available."
        />

        <BarChartCard
          title="Staff Roles & Positions"
          subtitle="Employee distribution by job title"
          items={posDistribution.map((p) => ({
            label: p.position || "Staff",
            value: p._count._all,
            color: "bg-blue-500",
          }))}
          emptyMessage="No employee position records available."
        />

        <BarChartCard
          title="Driver Behavior Violation Breakdown"
          subtitle="Telemetry event categories"
          items={[
            { label: "Speeding Events", value: speedEvents, color: "bg-red-500" },
            { label: "Harsh Braking", value: harshBraking, color: "bg-orange-500" },
            { label: "High RPM Events", value: highRPM, color: "bg-amber-500" },
            { label: "Rapid Acceleration", value: acceleration, color: "bg-yellow-500" },
          ]}
          emptyMessage="No telemetry safety events recorded."
        />
      </div>

      {/* Driver License Expiry Monitor */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Upcoming Driver License Expirations</h3>
        {expiringLicenses.length === 0 ? (
          <EmptyStatisticsState
            title="All driver licenses up to date"
            message="No driver licenses are expiring within the next 90 days."
          />
        ) : (
          <DataTable
            columns={[
              { key: "driverName", label: "Driver Name", render: (_, item: any) => item.user?.name || "Driver" },
              { key: "licenseNumber", label: "License Number" },
              {
                key: "licenseExpiry",
                label: "Expiration Date",
                render: (v) => (
                  <span className="font-bold text-amber-400">
                    {new Date(String(v)).toLocaleDateString()}
                  </span>
                ),
              },
              { key: "status", label: "Status", render: (v) => <span className="font-semibold text-white">{String(v)}</span> },
            ]}
            data={expiringLicenses}
            emptyMessage="No driver license records."
          />
        )}
      </div>
    </div>
  );
}
