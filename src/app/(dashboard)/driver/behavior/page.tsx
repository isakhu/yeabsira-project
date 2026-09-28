import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DriverBehaviorPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/signin");
  if (session.role !== "ADMIN" && session.role !== "DRIVER") redirect("/forbidden");

  const user = await prisma.user.findUnique({ where: { userId: session.userId } });
  const driver = user ? await prisma.driver.findUnique({ where: { userId: user.id } }) : null;
  const records = driver
    ? await prisma.driverBehavior.findMany({
        where: { driverId: driver.id },
        orderBy: { date: "desc" },
      })
    : [];

  const scores = records.map((r) =>
    Math.max(0, 100 - (r.speedEvents * 5 + r.harshBraking * 5 + r.highRPM * 3 + r.acceleration * 2))
  );

  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
    : 100;

  const latest = records[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">My Driving Behavior</h1>
        <p className="text-gray-400 mt-1">Personal telematics and safety performance</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-600 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Average Score</p>
          <p className="text-3xl font-extrabold text-brand-gold mt-1">{avgScore}<span className="text-lg text-gray-400">/100</span></p>
        </div>
        <div className="bg-slate-800 border border-slate-600 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Records</p>
          <p className="text-3xl font-extrabold text-white mt-1">{records.length}</p>
        </div>
        {latest && (
          <>
            <div className="bg-slate-800 border border-slate-600 rounded-2xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Last Speeding</p>
              <p className="text-3xl font-extrabold text-white mt-1">{latest.speedEvents}<span className="text-sm text-gray-400 ml-1">events</span></p>
            </div>
            <div className="bg-slate-800 border border-slate-600 rounded-2xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Last Harsh Braking</p>
              <p className="text-3xl font-extrabold text-white mt-1">{latest.harshBraking}<span className="text-sm text-gray-400 ml-1">events</span></p>
            </div>
          </>
        )}
      </div>

      {records.length > 0 && (
        <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Behavior History</h2>
          <div className="space-y-3">
            {records.map((r, idx) => {
              const score = scores[idx];
              return (
                <div key={r.id} className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0">
                  <div>
                    <p className="text-sm text-white">{new Date(r.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                    <p className="text-xs text-gray-400">Speeding: {r.speedEvents} · Harsh Braking: {r.harshBraking} · Harsh Accel: {r.acceleration}</p>
                  </div>
                  <span className={`text-lg font-bold ${score >= 80 ? "text-emerald-400" : score >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                    {score}/100
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
