import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobs = await prisma.maintenanceJob.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      vehicle: { select: { registration: true, make: true, model: true } },
      mechanic: { select: { name: true, userId: true } },
    },
  });

  return NextResponse.json({ jobs });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "ADMIN" && session.role !== "FLEET_MANAGER" && session.role !== "MECHANIC") {
    return NextResponse.json({ error: "Forbidden: Mechanic, Fleet Manager, or Admin required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { vehicleId, problem, description, priority } = body;

    if (!vehicleId || !problem) {
      return NextResponse.json({ error: "Vehicle and problem description are required" }, { status: 400 });
    }

    const job = await prisma.maintenanceJob.create({
      data: {
        vehicleId: Number(vehicleId),
        mechanicId: session.dbId,
        problem,
        description: description || "",
        priority: priority || "MEDIUM",
        status: "PENDING",
      },
    });

    // Update vehicle status to GARAGE if high priority
    await prisma.vehicle.update({
      where: { id: Number(vehicleId) },
      data: { status: "GARAGE" },
    }).catch(() => {});

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "MAINTENANCE_CREATE",
        target: `maintenance:${job.id}`,
        details: JSON.stringify({ vehicleId, problem, priority: job.priority }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, job }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create maintenance job" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "ADMIN" && session.role !== "FLEET_MANAGER" && session.role !== "MECHANIC") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Job ID and status required" }, { status: 400 });
    }

    const job = await prisma.maintenanceJob.update({
      where: { id: Number(id) },
      data: {
        status,
        ...(status === "COMPLETED" ? { completedAt: new Date() } : {}),
      },
    });

    // If completed, check if vehicle can return to IDLE
    if (status === "COMPLETED") {
      await prisma.vehicle.update({
        where: { id: job.vehicleId },
        data: { status: "IDLE" },
      }).catch(() => {});
    }

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "MAINTENANCE_UPDATE",
        target: `maintenance:${id}`,
        details: JSON.stringify({ status }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, job });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update maintenance job" }, { status: 500 });
  }
}
