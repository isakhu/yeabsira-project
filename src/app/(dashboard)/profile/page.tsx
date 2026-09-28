import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLE_DISPLAY_NAMES, type Role } from "@/lib/permissions";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/signin");

  const user = await prisma.user.findUnique({
    where: { userId: session.userId },
    select: {
      userId: true,
      name: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });

  if (!user) redirect("/signin");

  return (
    <ProfileClient
      userId={user.userId}
      name={user.name}
      role={user.role}
      roleDisplayName={ROLE_DISPLAY_NAMES[user.role as Role]}
      active={user.active}
      createdAt={user.createdAt.toISOString()}
    />
  );
}
