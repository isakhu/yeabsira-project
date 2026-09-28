import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import KPICard from "@/components/dashboard/KPICard";
import DataTable from "@/components/dashboard/DataTable";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { AddBookingButton } from "@/components/dashboard/CreateActionButtons";

export default async function TransportDashboard() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/signin");
  if (session.role !== "ADMIN" && session.role !== "TRANSPORT_MANAGER") redirect("/forbidden");

  const [
    pendingBookings,
    approvedBookings,
    activeAssignments,
    idleVehicles,
    bookings,
    assignments,
  ] = await Promise.all([
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.booking.count({ where: { status: "APPROVED" } }),
    prisma.assignment.count({ where: { status: { in: ["SCHEDULED", "IN_PROGRESS"] } } }),
    prisma.vehicle.count({ where: { status: "IDLE" } }),
    prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { requester: { select: { name: true } } },
    }),
    prisma.assignment.findMany({
      orderBy: { departure: "desc" },
      take: 8,
      include: {
        vehicle: { select: { registration: true } },
        driver: {
          include: {
            user: { select: { name: true } },
            employee: { select: { fullName: true, firstName: true, lastName: true } },
          },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Transport Manager Dashboard</h1>
          <p className="text-gray-400 mt-1">Booking approvals, dispatch, and driver assignment tracking</p>
        </div>
        <AddBookingButton />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Pending Requests" value={pendingBookings} icon="fas fa-clock" color="orange" />
        <KPICard title="Approved Trips" value={approvedBookings} icon="fas fa-check-circle" color="green" />
        <KPICard title="Active Dispatches" value={activeAssignments} icon="fas fa-route" color="blue" />
        <KPICard title="Available Fleet" value={idleVehicles} icon="fas fa-car" color="gold" />
      </div>

      {/* Bookings & Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Trip Bookings</h3>
          <DataTable
            columns={[
              { key: "requester", label: "Requester" },
              { key: "destination", label: "Destination" },
              { key: "purpose", label: "Purpose" },
              { key: "date", label: "Date" },
              { key: "status", label: "Status", render: (v) => <StatusBadge status={v as string} /> },
            ]}
            data={bookings.map((b) => ({
              requester: b.requester.name,
              destination: b.destination,
              purpose: b.purpose,
              date: new Date(b.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              status: b.status,
            }))}
            emptyMessage="No bookings"
          />
        </div>

        <div>
          <h3 className="text-lg font-bold text-white mb-4">Driver Assignments</h3>
          <DataTable
            columns={[
              { key: "vehicle", label: "Vehicle" },
              { key: "driver", label: "Driver" },
              { key: "destination", label: "Destination" },
              { key: "departure", label: "Departure" },
              { key: "status", label: "Status", render: (v) => <StatusBadge status={v as string} /> },
            ]}
            data={assignments.map((a) => ({
              vehicle: a.vehicle.registration,
              driver:
                a.driver.user?.name ||
                a.driver.employee?.fullName ||
                `${a.driver.employee?.firstName || ""} ${a.driver.employee?.lastName || ""}`.trim() ||
                "Driver",
              destination: a.destination,
              departure: new Date(a.departure).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
              status: a.status,
            }))}
            emptyMessage="No assignments"
          />
        </div>
      </div>
    </div>
  );
}
