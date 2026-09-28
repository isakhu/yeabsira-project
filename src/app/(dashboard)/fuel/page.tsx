import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import KPICard from "@/components/dashboard/KPICard";
import DataTable from "@/components/dashboard/DataTable";

import { AddFuelButton } from "@/components/dashboard/CreateActionButtons";

export default async function FuelDashboard() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/signin");
  if (session.role !== "ADMIN" && session.role !== "FUEL_CONTROLLER") redirect("/forbidden");

  const today = new Date(new Date().setHours(0, 0, 0, 0));
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [todayFuel, monthlyFuel, vehiclesRefueled, transactions] = await Promise.all([
    prisma.fuelTransaction.aggregate({
      _sum: { quantity: true, cost: true },
      where: { date: { gte: today } },
    }),
    prisma.fuelTransaction.aggregate({
      _sum: { quantity: true, cost: true },
      where: { date: { gte: monthStart } },
    }),
    prisma.fuelTransaction.groupBy({
      by: ["vehicleId"],
      where: { date: { gte: today } },
    }),
    prisma.fuelTransaction.findMany({
      orderBy: { date: "desc" },
      take: 12,
      include: {
        vehicle: { select: { registration: true, type: true } },
        controller: { select: { name: true } },
      },
    }),
  ]);

  // High consumption vehicles (monthly)
  const vehicleFuel = await prisma.fuelTransaction.groupBy({
    by: ["vehicleId"],
    _sum: { quantity: true, cost: true },
    _count: true,
    where: { date: { gte: monthStart } },
    orderBy: { _sum: { quantity: "desc" } },
    take: 5,
  });

  const highConsumptionVehicles = await Promise.all(
    vehicleFuel.map(async (vf) => {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: vf.vehicleId },
        select: { registration: true, type: true, mileage: true },
      });
      return {
        vehicle: vehicle?.registration || "Unknown",
        type: vehicle?.type || "",
        fuelUsed: `${vf._sum.quantity?.toFixed(1)}L`,
        cost: `ETB ${vf._sum.cost?.toLocaleString() || 0}`,
        refills: vf._count,
        status: (vf._sum.quantity || 0) > 100 ? "HIGH" : "MEDIUM",
      };
    })
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Fuel Controller Dashboard</h1>
          <p className="text-gray-400 mt-1">Fuel transactions, consumption monitoring, and cost tracking</p>
        </div>
        <AddFuelButton />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Today's Fuel Consumption"
          value={`${todayFuel._sum.quantity?.toFixed(0) || 0}L`}
          icon="fas fa-gas-pump"
          color="gold"
        />
        <KPICard
          title="Monthly Consumption"
          value={`${monthlyFuel._sum.quantity?.toFixed(0) || 0}L`}
          icon="fas fa-chart-bar"
          color="blue"
        />
        <KPICard
          title="Vehicles Refueled Today"
          value={vehiclesRefueled.length}
          icon="fas fa-truck"
          color="green"
        />
        <KPICard
          title="Monthly Fuel Cost"
          value={`ETB ${monthlyFuel._sum.cost?.toLocaleString() || 0}`}
          icon="fas fa-money-bill-wave"
          color="purple"
        />
      </div>

      {/* Fuel Transactions */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Recent Fuel Transactions</h3>
        <DataTable
          columns={[
            { key: "date", label: "Date" },
            { key: "vehicle", label: "Vehicle", render: (v) => <span className="font-mono text-brand-gold">{v as string}</span> },
            { key: "fuelType", label: "Fuel Type" },
            { key: "quantity", label: "Quantity" },
            { key: "cost", label: "Cost" },
            { key: "controller", label: "Controller" },
          ]}
          data={transactions.map((t) => ({
            date: new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            vehicle: t.vehicle.registration,
            fuelType: t.fuelType,
            quantity: `${t.quantity.toFixed(1)}L`,
            cost: `ETB ${t.cost.toLocaleString()}`,
            controller: t.controller?.name || "—",
          }))}
          emptyMessage="No fuel transactions"
        />
      </div>

      {/* High Consumption + Fuel Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High Consumption Vehicles */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Fuel Consumption by Vehicle (Monthly)</h3>
          <div className="bg-slate-800 border border-slate-600 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-600">
                    {["Vehicle", "Fuel Used", "Cost", "Refills"].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {highConsumptionVehicles.map((v, i) => (
                    <tr key={i} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-brand-gold">{v.vehicle}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{v.fuelUsed}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{v.cost}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{v.refills}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Fuel Alerts */}
        <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Fuel Alerts</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-red-400"></i>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">High Consumption</div>
                  <div className="text-xs text-gray-400">Vehicles exceeding expected usage</div>
                </div>
              </div>
              <span className="text-xl font-bold text-red-400">
                {highConsumptionVehicles.filter((v) => v.status === "HIGH").length}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <i className="fas fa-search text-yellow-400"></i>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Unusual Fuel Usage</div>
                  <div className="text-xs text-gray-400">Patterns requiring investigation</div>
                </div>
              </div>
              <span className="text-xl font-bold text-yellow-400">0</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <i className="fas fa-file-excel text-orange-400"></i>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Missing Transactions</div>
                  <div className="text-xs text-gray-400">Expected refuels not recorded</div>
                </div>
              </div>
              <span className="text-xl font-bold text-orange-400">0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
