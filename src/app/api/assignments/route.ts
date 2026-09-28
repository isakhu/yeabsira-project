import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const assignments = await prisma.assignment.findMany({
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
    });

    return NextResponse.json({ assignments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch assignments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "ADMIN" && session.role !== "TRANSPORT_MANAGER" && session.role !== "FLEET_MANAGER") {
    return NextResponse.json({ error: "Forbidden: Transport Manager, Fleet Manager or Admin required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { vehicleId, driverId, destination, departure, bookingId } = body;

    if (!vehicleId || !driverId || !destination) {
      return NextResponse.json({ error: "Vehicle, driver, and destination are required" }, { status: 400 });
    }

    const vehicleIdNum = Number(vehicleId);
    const driverIdNum = Number(driverId);

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleIdNum } });
    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    const driver = await prisma.driver.findUnique({ where: { id: driverIdNum } });
    if (!driver) {
      return NextResponse.json({ error: "Driver profile not found" }, { status: 404 });
    }

    // Create Assignment
    const assignment = await prisma.assignment.create({
      data: {
        vehicleId: vehicleIdNum,
        driverId: driverIdNum,
        destination,
        departure: departure ? new Date(departure) : new Date(),
        status: "IN_PROGRESS",
      },
      include: {
        vehicle: { select: { registration: true } },
        driver: {
          include: {
            user: { select: { name: true } },
            employee: { select: { fullName: true } },
          },
        },
      },
    });

    // Update vehicle operational status to FIELD_WORK
    await prisma.vehicle.update({
      where: { id: vehicleIdNum },
      data: { status: "FIELD_WORK", currentDriverId: driverIdNum },
    });

    // If bookingId supplied, update booking status
    if (bookingId) {
      await prisma.booking.update({
        where: { id: Number(bookingId) },
        data: { status: "APPROVED", vehicleId: vehicleIdNum, driverId: driverIdNum },
      }).catch(() => {});
    }

    await logAction(session.userId, "ASSIGNMENT_CREATE", `assignment:${assignment.id}`, {
      vehicle: vehicle.registration,
      destination,
    });

    await logAction(session.userId, "VEHICLE_STATUS_CHANGE", `vehicle:${vehicle.id}`, {
      status: "FIELD_WORK",
    });

    return NextResponse.json({ success: true, assignment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create assignment" }, { status: 500 });
  }
}
