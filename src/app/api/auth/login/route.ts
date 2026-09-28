import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { ROLE_DASHBOARD_ROUTES, type Role } from "@/lib/permissions";
import { logAction } from "@/lib/audit";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, password } = body;

    if (!userId || !password) {
      return NextResponse.json(
        { error: "User ID and password are required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { userId: String(userId) },
    });

    if (!user) {
      // Log failed attempt — use the provided userId
      await logAction(String(userId), "LOGIN_FAILED", undefined, {
        reason: "User not found",
      });
      return NextResponse.json(
        { error: "Invalid User ID or password" },
        { status: 401 }
      );
    }

    // Check if account is active
    if (!user.active) {
      await logAction(user.userId, "LOGIN_FAILED", undefined, {
        reason: "Account inactive",
      });
      return NextResponse.json(
        { error: "Your account is inactive. Please contact the administrator." },
        { status: 403 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      await logAction(user.userId, "LOGIN_FAILED", undefined, {
        reason: "Invalid password",
      });
      return NextResponse.json(
        { error: "Invalid User ID or password" },
        { status: 401 }
      );
    }

    // Create session
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    session.userId = user.userId;
    session.dbId = user.id;
    session.name = user.name;
    session.role = user.role as Role;
    session.mustChangePassword = user.mustChangePassword;
    session.isLoggedIn = true;
    await session.save();

    // Log successful login
    await logAction(user.userId, "LOGIN");

    // Determine redirect
    const redirect = user.mustChangePassword
      ? "/change-password"
      : ROLE_DASHBOARD_ROUTES[user.role as Role] || "/";

    return NextResponse.json({
      success: true,
      redirect,
      user: {
        userId: user.userId,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
