import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import VehiclesManagerClient from "@/components/dashboard/VehiclesManagerClient";

export default async function MechanicVehiclesPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/signin");
  if (session.role !== "ADMIN" && session.role !== "MECHANIC") redirect("/forbidden");

  const vehicles = await prisma.vehicle.findMany({
    orderBy: { registration: "asc" },
    include: {
      currentDriver: { include: { user: { select: { name: true } } } },
      _count: { select: { maintenanceJobs: true, vehicleServices: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Vehicle Fleet Status</h1>
        <p className="text-gray-400 mt-1">
          Vehicle mechanical and garage readiness tracking — {vehicles.length} vehicles
        </p>
      </div>

      <VehiclesManagerClient
        initialVehicles={vehicles as any}
        userRole={session.role}
      />
    </div>
  );
}
