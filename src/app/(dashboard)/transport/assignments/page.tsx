import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TransportAssignmentsClient from "@/components/dashboard/TransportAssignmentsClient";

export default async function TransportAssignmentsPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/signin");
  if (session.role !== "ADMIN" && session.role !== "TRANSPORT_MANAGER") redirect("/forbidden");

  const [assignmentsRaw, availableVehicles, activeDrivers] = await Promise.all([
    prisma.assignment.findMany({
      orderBy: { departure: "desc" },
      include: {
        vehicle: { select: { id: true, registration: true, type: true, status: true } },
        driver: {
          include: {
            user: { select: { name: true, userId: true } },
            employee: { select: { fullName: true, firstName: true, lastName: true, phoneNumber: true } },
          },
        },
      },
    }),
    prisma.vehicle.findMany({
      where: { status: "IDLE" },
      select: { id: true, registration: true, type: true, status: true },
    }),
    prisma.driver.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        driverId: true,
        licenseNumber: true,
        employee: { select: { fullName: true, firstName: true, lastName: true } },
        user: { select: { name: true } },
      },
    }),
  ]);

  const assignmentsFormatted = assignmentsRaw.map((a) => ({
    ...a,
    departure: a.departure.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Driver Assignments & Vehicle Dispatch</h1>
        <p className="text-gray-400 mt-1">
          Link available vehicles and active drivers to official transport trips — {assignmentsRaw.length} total dispatches
        </p>
      </div>

      <TransportAssignmentsClient
        initialAssignments={assignmentsFormatted as any}
        availableVehicles={availableVehicles}
        activeDrivers={activeDrivers as any}
        userRole={session.role}
      />
    </div>
  );
}
