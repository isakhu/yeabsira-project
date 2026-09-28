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

export default async function FuelStatisticsPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/signin");
  if (session.role !== "FUEL_CONTROLLER" && session.role !== "ADMIN") redirect("/forbidden");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    fuelAgg,
    fuelByType,
    monthlyFuel,
    topConsumingGroup,
  ] = await Promise.all([
    prisma.fuelTransaction.aggregate({
      _sum: { quantity: true, cost: true },
      _count: { id: true },
    }),
    prisma.fuelTransaction.groupBy({
      by: ["fuelType"],
      _sum: { quantity: true, cost: true },
      _count: { _all: true },
    }),
    prisma.fuelTransaction.aggregate({
      _sum: { quantity: true, cost: true },
      _count: { id: true },
      where: { date: { gte: startOfMonth } },
    }),
    prisma.fuelTransaction.groupBy({
      by: ["vehicleId"],
      _sum: { quantity: true, cost: true },
      _count: { _all: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  // Fetch vehicle details for top consumers
  const vehicleIds = topConsumingGroup.map((g) => g.vehicleId);
  const vehiclesMap = vehicleIds.length > 0
    ? new Map((await prisma.vehicle.findMany({ where: { id: { in: vehicleIds } } })).map((v) => [v.id, v]))
    : new Map();

  const topConsumingData = topConsumingGroup.map((g) => {
    const v = vehiclesMap.get(g.vehicleId);
    return {
      registration: v?.registration || `Vehicle #${g.vehicleId}`,
      makeModel: v ? `${v.make} ${v.model}` : "Unknown",
      fuelType: v?.fuelType || "N/A",
      totalQuantity: g._sum.quantity || 0,
      totalCost: g._sum.cost || 0,
      transactions: g._count._all,
    };
  });

  const totalQuantity = fuelAgg._sum.quantity || 0;
  const totalCost = fuelAgg._sum.cost || 0;
  const totalTransactions = fuelAgg._count.id || 0;

  const avgCostPerLiterDisplay = totalQuantity > 0
    ? `ETB ${(totalCost / totalQuantity).toFixed(2)}`
    : "Insufficient data";

  const monthlyQuantity = monthlyFuel._sum.quantity || 0;
  const monthlyCost = monthlyFuel._sum.cost || 0;

  const monthlyAvgCostDisplay = monthlyQuantity > 0
    ? `ETB ${(monthlyCost / monthlyQuantity).toFixed(2)}`
    : "Insufficient data";

  const csvHeaders = ["Category", "Metric", "Value"];
  const csvRows = [
    ["Fuel", "Total Liters Issued", totalQuantity],
    ["Fuel", "Total Expenditure (ETB)", totalCost],
    ["Fuel", "Total Fuel Transactions", totalTransactions],
    ["Fuel", "Overall Avg Cost / Liter", avgCostPerLiterDisplay],
    ["Fuel", "Monthly Fuel Volume (L)", monthlyQuantity],
    ["Fuel", "Monthly Fuel Spend (ETB)", monthlyCost],
    ["Fuel", "Monthly Avg Cost / Liter", monthlyAvgCostDisplay],
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Fuel Consumption & Expenditure Analytics
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Fuel transaction volume, cost breakdown by fuel type, and vehicle consumption rankings.
          </p>
        </div>
        <CSVExportButton
          filename="FMS_Fuel_Controller_Statistics"
          reportName="Fuel Controller Statistics"
          headers={csvHeaders}
          rows={csvRows}
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatMetricCard
          title="Total Fuel Spend"
          value={totalCost > 0 ? `ETB ${totalCost.toLocaleString()}` : 0}
          subtitle={`Across ${totalTransactions} transactions`}
          icon="fas fa-gas-pump"
          color="green"
        />
        <StatMetricCard
          title="Total Liters Issued"
          value={totalQuantity > 0 ? `${totalQuantity.toFixed(1)} L` : 0}
          subtitle="All recorded dispensations"
          icon="fas fa-oil-can"
          color="gold"
        />
        <StatMetricCard
          title="Average Cost per Liter"
          value={avgCostPerLiterDisplay}
          subtitle="Global fleet fuel unit cost"
          icon="fas fa-calculator"
          color="blue"
        />
        <StatMetricCard
          title="This Month's Spend"
          value={monthlyCost > 0 ? `ETB ${monthlyCost.toLocaleString()}` : 0}
          subtitle={`${monthlyQuantity.toFixed(1)} L issued this month`}
          icon="fas fa-calendar-alt"
          color="purple"
        />
      </div>

      {/* Fuel Type Distribution & Monthly Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChartCard
          title="Fuel Volume by Fuel Type"
          subtitle="Liters issued per fuel grade"
          items={fuelByType.map((f) => ({
            label: `${f.fuelType} (${(f._sum.quantity || 0).toFixed(0)} L)`,
            value: f._sum.quantity || 0,
            color: f.fuelType === "Diesel" ? "bg-amber-500" : "bg-emerald-500",
          }))}
          emptyMessage="No fuel transactions recorded."
        />

        <BarChartCard
          title="Fuel Cost by Fuel Type"
          subtitle="Expenditure in ETB per fuel grade"
          items={fuelByType.map((f) => ({
            label: `${f.fuelType} (ETB ${(f._sum.cost || 0).toLocaleString()})`,
            value: f._sum.cost || 0,
            color: f.fuelType === "Diesel" ? "bg-amber-500" : "bg-emerald-500",
          }))}
          emptyMessage="No fuel expenditure recorded."
        />
      </div>

      {/* Top Consuming Vehicles */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Top Fuel Consuming Vehicles</h3>
        {topConsumingData.length === 0 ? (
          <EmptyStatisticsState
            title="No fuel transactions recorded"
            message="Vehicle consumption statistics will appear here when fuel controller records dispensations."
          />
        ) : (
          <DataTable
            columns={[
              { key: "registration", label: "Registration", render: (v) => <span className="font-bold text-white">{String(v)}</span> },
              { key: "makeModel", label: "Make & Model" },
              { key: "fuelType", label: "Fuel Grade" },
              { key: "totalQuantity", label: "Volume (Liters)", render: (v) => <span className="font-bold text-brand-gold">{Number(v).toFixed(1)} L</span> },
              { key: "totalCost", label: "Total Cost", render: (v) => <span className="font-bold text-emerald-400">ETB {Number(v).toLocaleString()}</span> },
              { key: "transactions", label: "Transactions", render: (v) => `${v} tx` },
            ]}
            data={topConsumingData}
            emptyMessage="No vehicle fuel records available."
          />
        )}
      </div>
    </div>
  );
}
