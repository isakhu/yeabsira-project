import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { logAction } from "@/lib/audit";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/auth";
import { ROLE_DASHBOARD_ROUTES, type Role } from "@/lib/permissions";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "New passwords do not match" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { userId: session.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    // Hash new password and update
    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { userId: session.userId },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
      },
    });

    // Update session to clear mustChangePassword flag
    const cookieStore = await cookies();
    const ironSession = await getIronSession<SessionData>(cookieStore, sessionOptions);
    ironSession.mustChangePassword = false;
    await ironSession.save();

    // Log the action (never log the actual password)
    await logAction(session.userId, "PASSWORD_CHANGE");

    const redirect = ROLE_DASHBOARD_ROUTES[session.role as Role] || "/";

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
      redirect,
    });
  } catch (error) {
    console.error("Password change error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
