import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookings = await prisma.booking.findMany({
    orderBy: { date: "desc" },
    include: { requester: { select: { name: true, userId: true, role: true } } },
  });

  return NextResponse.json({ bookings });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { destination, purpose, date, returnDate } = body;

    if (!destination || !purpose) {
      return NextResponse.json({ error: "Destination and purpose are required" }, { status: 400 });
    }

    const booking = await prisma.booking.create({
      data: {
        requesterId: session.dbId,
        destination,
        purpose,
        status: "PENDING",
        date: date ? new Date(date) : new Date(),
        returnDate: returnDate ? new Date(returnDate) : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "BOOKING_CREATE",
        target: `booking:${booking.id}`,
        details: JSON.stringify({ destination, purpose }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, booking }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create booking" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "ADMIN" && session.role !== "TRANSPORT_MANAGER") {
    return NextResponse.json({ error: "Forbidden: Transport Manager or Admin required to approve bookings" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Booking ID and status required" }, { status: 400 });
    }

    const updated = await prisma.booking.update({
      where: { id: Number(id) },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "BOOKING_UPDATE",
        target: `booking:${id}`,
        details: JSON.stringify({ status }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, booking: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update booking" }, { status: 500 });
  }
}
