import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DriverBehaviorClient from "@/components/dashboard/DriverBehaviorClient";

export default async function TransportBehaviorPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/signin");
  if (session.role !== "ADMIN" && session.role !== "TRANSPORT_MANAGER") redirect("/forbidden");

  const [recordsRaw, driversRaw] = await Promise.all([
    prisma.driverBehavior.findMany({
      orderBy: { date: "desc" },
      include: {
        driver: {
          include: {
            user: { select: { name: true, userId: true } },
            employee: { select: { fullName: true, firstName: true, lastName: true, employeeId: true } },
          },
        },
      },
    }),
    prisma.driver.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        driverId: true,
        licenseNumber: true,
        user: { select: { name: true } },
        employee: { select: { fullName: true, firstName: true, lastName: true } },
      },
    }),
  ]);

  const recordsFormatted = recordsRaw.map((r) => ({
    ...r,
    date: r.date.toISOString(),
  }));

  const driversFormatted = driversRaw.map((d) => ({
    id: d.id,
    name: d.user?.name || d.employee?.fullName || `${d.employee?.firstName || ""} ${d.employee?.lastName || ""}`.trim() || "Driver",
    driverId: d.driverId,
    licenseNumber: d.licenseNumber,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Driver Behavior & Telematics</h1>
        <p className="text-gray-400 mt-1">
          Safety monitoring, violation tracking, and driver performance — {recordsRaw.length} entries
        </p>
      </div>

      <DriverBehaviorClient
        initialRecords={recordsFormatted as any}
        drivers={driversFormatted}
        userRole={session.role}
      />
    </div>
  );
}
