import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin required" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, userId: true, name: true, role: true, active: true, createdAt: true },
  });

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin required to create accounts" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, name, role, password } = body;

    if (!userId || !name || !role || !password) {
      return NextResponse.json({ error: "User ID, Name, Role, and Password are required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { userId: String(userId) } });
    if (existing) {
      return NextResponse.json({ error: "User ID already exists" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        userId: String(userId),
        name,
        role,
        passwordHash,
        active: true,
        mustChangePassword: true,
      },
    });

    // Auto-create Employee profile for the new user
    await prisma.employee.create({
      data: {
        userId: newUser.id,
        department: role === "HR" ? "Human Resources" : role === "MECHANIC" ? "Maintenance" : "Fleet Operations",
        position: role.replace(/_/g, " "),
        status: "ACTIVE",
      },
    }).catch(() => {});

    if (role === "DRIVER") {
      await prisma.driver.create({
        data: {
          userId: newUser.id,
          licenseNumber: `ETH-DL-${newUser.userId}`,
          licenseExpiry: new Date("2029-12-31"),
          status: "ACTIVE",
        },
      }).catch(() => {});
    }

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "USER_CREATE",
        target: `user:${newUser.userId}`,
        details: JSON.stringify({ role, name }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, user: { userId: newUser.userId, name: newUser.name, role: newUser.role } }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 500 });
  }
}
