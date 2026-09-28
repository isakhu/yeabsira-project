import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/auth";

export async function POST() {
  try {
    const session = await getSession();

    if (session.isLoggedIn) {
      await logAction(session.userId, "LOGOUT");
    }

    // Destroy the session by overwriting with empty data
    const cookieStore = await cookies();
    const ironSession = await getIronSession<SessionData>(cookieStore, sessionOptions);
    ironSession.destroy();

    return NextResponse.json({ success: true, redirect: "/" });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
}
