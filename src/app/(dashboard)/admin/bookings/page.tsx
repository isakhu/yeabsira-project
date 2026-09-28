import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TransportBookingsClient from "@/components/dashboard/TransportBookingsClient";
import { AddBookingButton } from "@/components/dashboard/CreateActionButtons";

export default async function AdminBookingsPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/signin");
  if (session.role !== "ADMIN") redirect("/forbidden");

  const bookingsRaw = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      requester: { select: { name: true, userId: true } },
      vehicle: { select: { registration: true } },
    },
  });

  const bookingsFormatted = bookingsRaw.map((b) => ({
    ...b,
    date: b.date.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Global Booking Requisitions & Approvals</h1>
          <p className="text-gray-400 mt-1">Review, approve, or submit transport requests — {bookingsRaw.length} total records</p>
        </div>
        <AddBookingButton />
      </div>

      <TransportBookingsClient initialBookings={bookingsFormatted as any} userRole={session.role} />
    </div>
  );
}
