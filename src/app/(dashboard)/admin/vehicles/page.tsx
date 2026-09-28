import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import VehiclesManagerClient from "@/components/dashboard/VehiclesManagerClient";

export default async function AdminVehiclesPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/signin");
  if (session.role !== "ADMIN") redirect("/forbidden");

  const vehicles = await prisma.vehicle.findMany({
    orderBy: { registration: "asc" },
    include: { currentDriver: { include: { user: { select: { name: true } } } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Vehicle Inventory</h1>
        <p className="text-gray-400 mt-1">Complete fleet vehicle registry, operational readiness, and assignment — {vehicles.length} vehicles</p>
      </div>

      <VehiclesManagerClient
        initialVehicles={vehicles as any}
        userRole={session.role}
      />
    </div>
  );
}
