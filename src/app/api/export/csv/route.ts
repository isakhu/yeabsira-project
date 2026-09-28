import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCsvContent } from "@/lib/exportCsv";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { filename, headers, rows, reportName } = body;

    if (!headers || !rows) {
      return NextResponse.json({ error: "Headers and rows are required" }, { status: 400 });
    }

    const safeReportName = reportName || filename || "CSV Export";
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "STATISTICS_EXPORT",
        target: `report:${safeReportName}`,
        details: JSON.stringify({
          format: "CSV",
          role: session.role,
          rowsCount: Array.isArray(rows) ? rows.length : 0,
        }),
      },
    }).catch(() => {});

    const csvContent = generateCsvContent(headers, rows);
    const cleanBase = (filename || "export")
      .replace(/\.csv$/i, "")
      .replace(/[/\\?%*:|"<>]/g, "_")
      .trim();
    const safeFilename = `${cleanBase || "export"}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
        "Cache-Control": "no-cache, no-store",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to generate CSV" }, { status: 500 });
  }
}
