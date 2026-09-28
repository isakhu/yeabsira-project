import { SessionOptions, getIronSession } from "iron-session";
import { cookies } from "next/headers";
import type { Role } from "./permissions";

// ─── Session Data Shape ───
export interface SessionData {
  userId: string;
  dbId: number;
  name: string;
  role: Role;
  mustChangePassword: boolean;
  isLoggedIn: boolean;
}

// ─── iron-session Options ───
export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "fallback-secret-key-must-be-at-least-32-characters-long!",
  cookieName: "fms_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 8, // 8 hours
    path: "/",
  },
};

// ─── Get Session (Server Components / API Routes) ───
export async function getSession(): Promise<SessionData> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  return session;
}

// ─── Destroy Session ───
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  session.destroy();
}
