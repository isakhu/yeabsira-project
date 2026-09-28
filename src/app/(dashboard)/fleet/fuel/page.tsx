import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DataTable from "@/components/dashboard/DataTable";
import { CSVExportButton } from "@/components/dashboard/StatisticsCharts";

export default async function FleetFuelPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/signin");
  if (session.role !== "ADMIN" && session.role !== "FLEET_MANAGER") redirect("/forbidden");

  const transactions = await prisma.fuelTransaction.findMany({
    orderBy: { date: "desc" },
    include: {
      vehicle: { select: { registration: true, make: true, model: true } },
    },
  });

  const totalCost = transactions.reduce((sum, t) => sum + t.cost, 0);
  const totalLiters = transactions.reduce((sum, t) => sum + t.quantity, 0);

  const csvHeaders = ["Transaction Date", "Vehicle Plate", "Make / Model", "Fuel Type", "Quantity (L)", "Total Cost (ETB)"];
  const csvRows = transactions.map((t) => [
    new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    t.vehicle.registration,
    `${t.vehicle.make} ${t.vehicle.model}`,
    t.fuelType,
    t.quantity.toFixed(1),
    t.cost.toFixed(2),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Fuel Overview</h1>
          <p className="text-gray-400 mt-1">
            Fleet fuel consumption tracking — {totalLiters.toFixed(0)}L total, ETB {totalCost.toLocaleString()}
          </p>
        </div>
        <CSVExportButton
          filename="FMS_Fleet_Fuel_Overview"
          reportName="Fleet Fuel Overview Report"
          headers={csvHeaders}
          rows={csvRows}
        />
      </div>

      <DataTable
        columns={[
          { key: "date", label: "Date" },
          { key: "vehicle", label: "Vehicle", render: (v) => <span className="font-mono text-brand-gold font-bold">{v as string}</span> },
          { key: "vehicleInfo", label: "Make / Model" },
          { key: "fuelType", label: "Fuel" },
          { key: "quantity", label: "Liters" },
          { key: "cost", label: "Cost" },
        ]}
        data={transactions.map((t) => ({
          date: new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          vehicle: t.vehicle.registration,
          vehicleInfo: `${t.vehicle.make} ${t.vehicle.model}`,
          fuelType: t.fuelType,
          quantity: `${t.quantity.toFixed(1)}L`,
          cost: `ETB ${t.cost.toLocaleString()}`,
        }))}
        emptyMessage="No fuel dispensation records."
      />
    </div>
  );
}
