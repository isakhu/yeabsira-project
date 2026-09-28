import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vehicles = await prisma.vehicle.findMany({
    orderBy: { createdAt: "desc" },
    include: { currentDriver: { select: { id: true, user: { select: { name: true } } } } },
  });

  return NextResponse.json({ vehicles });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "ADMIN" && session.role !== "FLEET_MANAGER") {
    return NextResponse.json({ error: "Forbidden: Fleet Manager or Admin access required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { registration, type, make, model, year, fuelType, mileage, status } = body;

    if (!registration || !type || !make || !model || !year || !fuelType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await prisma.vehicle.findUnique({ where: { registration } });
    if (existing) {
      return NextResponse.json({ error: "Vehicle with this registration already exists" }, { status: 400 });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        registration: registration.toUpperCase(),
        type,
        make,
        model,
        year: Number(year),
        fuelType,
        mileage: Number(mileage) || 0,
        status: status || "IDLE",
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "VEHICLE_CREATE",
        target: `vehicle:${vehicle.registration}`,
        details: JSON.stringify({ make, model, type, status: vehicle.status }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, vehicle }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create vehicle" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "ADMIN" && session.role !== "FLEET_MANAGER" && session.role !== "MECHANIC") {
    return NextResponse.json({ error: "Forbidden: Fleet Manager, Mechanic, or Admin required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, status, mileage, currentDriverId } = body;

    if (!id) {
      return NextResponse.json({ error: "Vehicle ID required" }, { status: 400 });
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (mileage !== undefined) updateData.mileage = Number(mileage);
    if (currentDriverId !== undefined) {
      updateData.currentDriverId = currentDriverId ? Number(currentDriverId) : null;
    }

    const vehicle = await prisma.vehicle.update({
      where: { id: Number(id) },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "VEHICLE_UPDATE",
        target: `vehicle:${vehicle.registration}`,
        details: JSON.stringify(updateData),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, vehicle });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update vehicle" }, { status: 500 });
  }
}
