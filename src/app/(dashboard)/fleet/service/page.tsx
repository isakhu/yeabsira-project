import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import VehicleServiceManagerClient from "@/components/dashboard/VehicleServiceManagerClient";

export default async function FleetServicePage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/signin");
  if (session.role !== "ADMIN" && session.role !== "FLEET_MANAGER") redirect("/forbidden");

  const [servicesRaw, vehicles] = await Promise.all([
    prisma.vehicleService.findMany({
      orderBy: { dueDate: "asc" },
      include: { vehicle: { select: { id: true, registration: true, make: true, model: true } } },
    }),
    prisma.vehicle.findMany({
      orderBy: { registration: "asc" },
      select: { id: true, registration: true, make: true, model: true },
    }),
  ]);

  const servicesFormatted = servicesRaw.map((s) => ({
    ...s,
    dueDate: s.dueDate.toISOString(),
    completedAt: s.completedAt ? s.completedAt.toISOString() : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Vehicle Service Schedules</h1>
        <p className="text-gray-400 mt-1">
          Fleet preventive maintenance cycles, inspection schedules, and history — {servicesRaw.length} records
        </p>
      </div>

      <VehicleServiceManagerClient
        initialServices={servicesFormatted as any}
        vehicles={vehicles}
        userRole={session.role}
      />
    </div>
  );
}
