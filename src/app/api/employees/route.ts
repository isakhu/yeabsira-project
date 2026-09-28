import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";
import * as bcrypt from "bcryptjs";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "ADMIN" && session.role !== "HR") {
    return NextResponse.json({ error: "Forbidden: HR or Admin required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.toLowerCase().trim();
  const department = searchParams.get("department");
  const status = searchParams.get("status");

  try {
    const where: any = {};

    if (department && department !== "ALL") {
      where.department = department;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    let employees = await prisma.employee.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, userId: true, name: true, role: true, active: true } },
        driver: { select: { id: true, driverId: true, licenseNumber: true, status: true } },
      },
    });

    if (search) {
      employees = employees.filter((e) => {
        const empId = e.employeeId?.toLowerCase() || "";
        const name = (e.fullName || `${e.firstName || ""} ${e.lastName || ""}`).toLowerCase();
        const phone = e.phoneNumber?.toLowerCase() || "";
        const email = e.email?.toLowerCase() || "";
        const userName = e.user?.name.toLowerCase() || "";
        return empId.includes(search) || name.includes(search) || phone.includes(search) || email.includes(search) || userName.includes(search);
      });
    }

    return NextResponse.json({ employees });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch employees" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "ADMIN" && session.role !== "HR") {
    return NextResponse.json({ error: "Forbidden: HR or Admin required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      employeeId,
      firstName,
      middleName,
      lastName,
      gender,
      dateOfBirth,
      phoneNumber,
      alternatePhoneNumber,
      email,
      address,
      city,
      department,
      position,
      employmentType,
      hireDate,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelationship,
      notes,
      createSystemAccount,
      accountUserId,
      accountPassword,
      accountRole,
    } = body;

    if (!firstName || !lastName || !department || !position) {
      return NextResponse.json({ error: "First name, last name, department, and position are required" }, { status: 400 });
    }

    // Auto-generate employeeId if not supplied
    const finalEmployeeId = employeeId?.trim() || `EMP-${Date.now().toString().slice(-5)}`;

    // Check unique employeeId
    const existingEmp = await prisma.employee.findUnique({ where: { employeeId: finalEmployeeId } });
    if (existingEmp) {
      return NextResponse.json({ error: `Employee ID "${finalEmployeeId}" already exists.` }, { status: 400 });
    }

    // Basic email validation if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    let createdUser = null;
    if (createSystemAccount) {
      if (!accountUserId || !accountPassword || !accountRole) {
        return NextResponse.json({ error: "System account requires User ID, Password, and Role" }, { status: 400 });
      }

      const existingUser = await prisma.user.findUnique({ where: { userId: String(accountUserId) } });
      if (existingUser) {
        return NextResponse.json({ error: `User ID "${accountUserId}" already exists` }, { status: 400 });
      }

      const passwordHash = await bcrypt.hash(accountPassword, 12);
      createdUser = await prisma.user.create({
        data: {
          userId: String(accountUserId),
          name: `${firstName} ${lastName}`,
          passwordHash,
          role: accountRole,
          active: true,
          mustChangePassword: true,
        },
      });

      await logAction(session.userId, "USER_CREATE", `user:${createdUser.userId}`, { role: accountRole });
    }

    const fullName = `${firstName} ${middleName ? middleName + " " : ""}${lastName}`.trim();

    const employee = await prisma.employee.create({
      data: {
        employeeId: finalEmployeeId,
        userId: createdUser?.id ?? null,
        firstName,
        middleName: middleName || null,
        lastName,
        fullName,
        gender: gender || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        phoneNumber: phoneNumber || null,
        alternatePhoneNumber: alternatePhoneNumber || null,
        email: email || null,
        address: address || null,
        city: city || null,
        department,
        position,
        employmentType: employmentType || "FULL_TIME",
        hireDate: hireDate ? new Date(hireDate) : null,
        status: "ACTIVE",
        emergencyContactName: emergencyContactName || null,
        emergencyContactPhone: emergencyContactPhone || null,
        emergencyContactRelationship: emergencyContactRelationship || null,
        notes: notes || null,
      },
      include: {
        user: { select: { userId: true, role: true, active: true } },
      },
    });

    await logAction(session.userId, "EMPLOYEE_CREATE", `employee:${employee.employeeId}`, {
      department,
      position,
      hasAccount: !!createdUser,
    });

    return NextResponse.json({ success: true, employee }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create employee" }, { status: 500 });
  }
}
