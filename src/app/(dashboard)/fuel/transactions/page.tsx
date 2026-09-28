import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DataTable from "@/components/dashboard/DataTable";
import { AddFuelButton } from "@/components/dashboard/CreateActionButtons";
import { CSVExportButton } from "@/components/dashboard/StatisticsCharts";

export default async function FuelTransactionsPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/signin");
  if (session.role !== "ADMIN" && session.role !== "FUEL_CONTROLLER") redirect("/forbidden");

  const [transactions, vehicles] = await Promise.all([
    prisma.fuelTransaction.findMany({
      orderBy: { date: "desc" },
      include: {
        vehicle: { select: { registration: true, make: true, model: true } },
        controller: { select: { name: true } },
      },
    }),
    prisma.vehicle.findMany({
      orderBy: { registration: "asc" },
      select: { id: true, registration: true, make: true, model: true },
    }),
  ]);

  const totalQuantity = transactions.reduce((sum, t) => sum + t.quantity, 0);
  const totalCost = transactions.reduce((sum, t) => sum + t.cost, 0);

  const csvHeaders = ["Date", "Vehicle Registration", "Make / Model", "Fuel Type", "Quantity (L)", "Cost (ETB)", "Logged By Controller"];
  const csvRows = transactions.map((t) => [
    new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    t.vehicle.registration,
    `${t.vehicle.make} ${t.vehicle.model}`,
    t.fuelType,
    t.quantity.toFixed(1),
    t.cost.toFixed(2),
    t.controller?.name || "—",
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Fuel Dispensation Transactions</h1>
          <p className="text-gray-400 mt-1">
            Complete dispensation log — {transactions.length} records ({totalQuantity.toFixed(1)}L total, ETB {totalCost.toLocaleString()})
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CSVExportButton
            filename="FMS_Fuel_Transactions_Log"
            reportName="Fuel Transactions Log"
            headers={csvHeaders}
            rows={csvRows}
          />
          <AddFuelButton vehicles={vehicles} />
        </div>
      </div>

      <DataTable
        columns={[
          { key: "date", label: "Date" },
          { key: "vehicle", label: "Vehicle", render: (v) => <span className="font-mono text-brand-gold font-bold">{v as string}</span> },
          { key: "vehicleInfo", label: "Make / Model" },
          { key: "fuelType", label: "Fuel Type" },
          { key: "quantity", label: "Liters" },
          { key: "cost", label: "Cost (ETB)" },
          { key: "controller", label: "Controller" },
        ]}
        data={transactions.map((t) => ({
          date: new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          vehicle: t.vehicle.registration,
          vehicleInfo: `${t.vehicle.make} ${t.vehicle.model}`,
          fuelType: t.fuelType,
          quantity: `${t.quantity.toFixed(1)}L`,
          cost: `ETB ${t.cost.toLocaleString()}`,
          controller: t.controller?.name || "—",
        }))}
        emptyMessage="No fuel dispensation transactions recorded."
      />
    </div>
  );
}
