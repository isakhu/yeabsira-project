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
    const services = await prisma.vehicleService.findMany({
      orderBy: { dueDate: "asc" },
      include: {
        vehicle: {
          select: { id: true, registration: true, make: true, model: true, mileage: true, status: true },
        },
      },
    });

    return NextResponse.json({ services });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch services" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "ADMIN" && session.role !== "FLEET_MANAGER" && session.role !== "MECHANIC") {
    return NextResponse.json({ error: "Forbidden: Fleet Manager, Mechanic, or Admin required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { vehicleId, serviceType, dueDate, mileage, status } = body;

    if (!vehicleId || !serviceType || !dueDate) {
      return NextResponse.json({ error: "Vehicle, service type, and due date are required" }, { status: 400 });
    }

    const vehicleIdNum = Number(vehicleId);
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleIdNum } });
    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    const service = await prisma.vehicleService.create({
      data: {
        vehicleId: vehicleIdNum,
        serviceType,
        dueDate: new Date(dueDate),
        mileage: mileage ? Number(mileage) : (vehicle.mileage || null),
        status: status || "SCHEDULED",
      },
      include: {
        vehicle: {
          select: { id: true, registration: true, make: true, model: true, status: true },
        },
      },
    });

    await logAction(session.userId, "SERVICE_SCHEDULE", `service:${service.id}`, {
      vehicle: vehicle.registration,
      serviceType,
      dueDate,
    });

    return NextResponse.json({ success: true, service }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to schedule service" }, { status: 500 });
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
    const { id, status, mileage } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Service ID and status are required" }, { status: 400 });
    }

    const updateData: any = { status };
    if (status === "COMPLETED") {
      updateData.completedAt = new Date();
      if (mileage) updateData.mileage = Number(mileage);
    }

    const updated = await prisma.vehicleService.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        vehicle: { select: { registration: true, id: true } },
      },
    });

    await logAction(session.userId, "SERVICE_UPDATE", `service:${id}`, {
      status,
      vehicle: updated.vehicle.registration,
    });

    return NextResponse.json({ success: true, service: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update service" }, { status: 500 });
  }
}
