import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DataTable from "@/components/dashboard/DataTable";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { AddBookingButton } from "@/components/dashboard/CreateActionButtons";

export default async function DriverBookingsPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/signin");
  if (session.role !== "ADMIN" && session.role !== "DRIVER") redirect("/forbidden");

  const user = await prisma.user.findUnique({ where: { userId: session.userId } });
  const bookings = user
    ? await prisma.booking.findMany({
        where: { requesterId: user.id },
        orderBy: { createdAt: "desc" },
        include: { vehicle: { select: { registration: true } } },
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Trip Booking Requisitions</h1>
          <p className="text-gray-400 mt-1">Submit official transport requests — {bookings.length} submitted requests</p>
        </div>
        <AddBookingButton />
      </div>

      <DataTable
        columns={[
          { key: "destination", label: "Destination" },
          { key: "purpose", label: "Purpose / Reason" },
          { key: "vehicle", label: "Vehicle", render: (v) => <span className="font-mono text-brand-gold">{v as string}</span> },
          { key: "date", label: "Departure Date" },
          { key: "returnDate", label: "Return Date" },
          { key: "status", label: "Status", render: (v) => <StatusBadge status={v as string} /> },
        ]}
        data={bookings.map((b) => ({
          destination: b.destination,
          purpose: b.purpose,
          vehicle: b.vehicle?.registration || "Unassigned",
          date: new Date(b.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          returnDate: b.returnDate ? new Date(b.returnDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A",
          status: b.status,
        }))}
        emptyMessage="No booking requests submitted yet."
      />
    </div>
  );
}
