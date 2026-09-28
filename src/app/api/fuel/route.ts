import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transactions = await prisma.fuelTransaction.findMany({
    orderBy: { date: "desc" },
    include: {
      vehicle: { select: { registration: true, make: true, model: true } },
      controller: { select: { name: true, userId: true } },
    },
  });

  return NextResponse.json({ transactions });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "ADMIN" && session.role !== "FUEL_CONTROLLER") {
    return NextResponse.json({ error: "Forbidden: Fuel Controller or Admin required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { vehicleId, quantity, cost, odometer, fuelType } = body;

    if (!vehicleId || !quantity || !cost) {
      return NextResponse.json({ error: "Vehicle, quantity (liters), and cost (ETB) are required" }, { status: 400 });
    }

    const transaction = await prisma.fuelTransaction.create({
      data: {
        vehicleId: Number(vehicleId),
        controllerId: session.dbId,
        quantity: Number(quantity),
        cost: Number(cost),
        odometer: Number(odometer) || 0,
        fuelType: fuelType || "Diesel",
        date: new Date(),
      },
    });

    // Update vehicle mileage if odometer provided
    if (odometer && Number(odometer) > 0) {
      await prisma.vehicle.update({
        where: { id: Number(vehicleId) },
        data: { mileage: Number(odometer) },
      }).catch(() => {});
    }

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "FUEL_LOG",
        target: `fuel:${transaction.id}`,
        details: JSON.stringify({ vehicleId, quantity, cost }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, transaction }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to log fuel transaction" }, { status: 500 });
  }
}
