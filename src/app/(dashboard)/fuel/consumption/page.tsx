import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DataTable from "@/components/dashboard/DataTable";
import { CSVExportButton } from "@/components/dashboard/StatisticsCharts";

export default async function FuelConsumptionPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/signin");
  if (session.role !== "ADMIN" && session.role !== "FUEL_CONTROLLER") redirect("/forbidden");

  // Aggregate fuel consumption per vehicle
  const vehicleFuel = await prisma.fuelTransaction.groupBy({
    by: ["vehicleId"],
    _sum: { quantity: true, cost: true },
    _count: true,
    orderBy: { _sum: { quantity: "desc" } },
  });

  const vehicles = await prisma.vehicle.findMany({
    where: { id: { in: vehicleFuel.map((vf) => vf.vehicleId) } },
    select: { id: true, registration: true, make: true, model: true },
  });

  const vehicleMap = new Map(vehicles.map((v) => [v.id, v]));

  const csvHeaders = ["Vehicle Registration", "Make / Model", "Total Fill Transactions", "Total Liters Consumed", "Total Cost (ETB)", "Average Volume per Fill"];
  const csvRows = vehicleFuel.map((vf) => {
    const v = vehicleMap.get(vf.vehicleId);
    const totalQ = vf._sum.quantity || 0;
    const totalC = vf._sum.cost || 0;
    return [
      v?.registration || `Vehicle #${vf.vehicleId}`,
      v ? `${v.make} ${v.model}` : "—",
      vf._count,
      totalQ.toFixed(1),
      totalC.toFixed(2),
      (totalQ / vf._count).toFixed(1),
    ];
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Fuel Consumption Analysis</h1>
          <p className="text-gray-400 mt-1">Per-vehicle fuel efficiency and expenditure summary</p>
        </div>
        <CSVExportButton
          filename="FMS_Vehicle_Fuel_Consumption_Analysis"
          reportName="Vehicle Fuel Consumption Analysis"
          headers={csvHeaders}
          rows={csvRows}
        />
      </div>

      <DataTable
        columns={[
          { key: "vehicle", label: "Vehicle", render: (v) => <span className="font-mono text-brand-gold font-bold">{v as string}</span> },
          { key: "vehicleInfo", label: "Make / Model" },
          { key: "transactions", label: "Transactions" },
          { key: "totalLiters", label: "Total Liters" },
          { key: "totalCost", label: "Total Cost" },
          { key: "avgPerTx", label: "Avg per Fill" },
        ]}
        data={vehicleFuel.map((vf) => {
          const v = vehicleMap.get(vf.vehicleId);
          const totalQ = vf._sum.quantity || 0;
          return {
            vehicle: v?.registration || "Unknown",
            vehicleInfo: v ? `${v.make} ${v.model}` : "—",
            transactions: vf._count,
            totalLiters: `${totalQ.toFixed(1)}L`,
            totalCost: `ETB ${(vf._sum.cost || 0).toLocaleString()}`,
            avgPerTx: `${(totalQ / vf._count).toFixed(1)}L`,
          };
        })}
        emptyMessage="No vehicle consumption records found."
      />
    </div>
  );
}
