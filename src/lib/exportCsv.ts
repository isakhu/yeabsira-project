/**
 * Universal CSV Export Utility
 * - Uses Blob and URL.createObjectURL for reliable, fast downloads across all modern browsers.
 * - Implements RFC 4180 quoting and formatting (preserves numbers for Excel calculations).
 * - Sanitizes formula injection (=, +, -, @) while preserving negative numbers and phone numbers.
 * - Prepends UTF-8 BOM (\uFEFF) for full Excel Unicode support (Amharic, symbols, currencies).
 * - Avoids display: none on anchors to prevent Chromium and Firefox synthetic click suppression.
 * - Supports arrays of arrays, arrays of objects, and lazy function getters.
 * - Falls back to data URI and server export endpoint (/api/export/csv) if client blob download is blocked.
 */

export function formatCsvField(val: unknown): string {
  if (val === null || val === undefined) return "";

  // Numbers and booleans should remain raw so Excel/Sheets treats them as numeric/boolean
  if (typeof val === "number" || typeof val === "boolean") {
    return String(val);
  }

  if (val instanceof Date) {
    return isNaN(val.getTime()) ? "" : val.toISOString().split("T")[0];
  }

  let str = String(val).trim();

  // Prevent formula injection if string begins with =, +, -, @, \t, \r (unless it's a valid number)
  const isDangerousFormula = /^[=+\-@\t\r]/.test(str) && isNaN(Number(str));
  if (isDangerousFormula) {
    str = `'${str}`;
  }

  // If string contains comma, double quote, newlines, or was formula-escaped, wrap in quotes & escape quotes
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r") ||
    isDangerousFormula
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export function generateCsvContent(
  headers: unknown,
  rows: unknown
): string {
  const resolvedHeaders = typeof headers === "function" ? (headers as () => unknown)() : headers;
  const resolvedRows = typeof rows === "function" ? (rows as () => unknown)() : rows;

  const safeHeaders: string[] = Array.isArray(resolvedHeaders)
    ? resolvedHeaders.map(String)
    : [];

  const rawRows: unknown[] = Array.isArray(resolvedRows) ? resolvedRows : [];

  const headerLine = safeHeaders.map(formatCsvField).join(",");

  const dataLines = rawRows.map((row) => {
    if (Array.isArray(row)) {
      return row.map(formatCsvField).join(",");
    }

    if (row !== null && typeof row === "object") {
      const rowObj = row as Record<string, unknown>;
      if (safeHeaders.length > 0) {
        return safeHeaders
          .map((header) => {
            if (header in rowObj) return formatCsvField(rowObj[header]);

            // Match case-insensitively or ignoring punctuation
            const cleanHeader = header.toLowerCase().replace(/[^a-z0-9]/g, "");
            const matchedKey = Object.keys(rowObj).find((k) => {
              const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, "");
              return cleanK === cleanHeader || k.toLowerCase() === header.toLowerCase();
            });

            if (matchedKey && matchedKey in rowObj) {
              return formatCsvField(rowObj[matchedKey]);
            }
            return "";
          })
          .join(",");
      } else {
        return Object.values(rowObj).map(formatCsvField).join(",");
      }
    }

    return formatCsvField(row);
  });

  const allLines = [headerLine, ...dataLines];
  return "\uFEFF" + allLines.join("\r\n") + "\r\n";
}

export function exportToCSV(
  filename: string,
  headers: unknown,
  rows: unknown,
  reportName?: string
) {
  if (typeof window === "undefined") return;

  const safeReportName = reportName || filename || "CSV Export";

  // 1. Audit logging asynchronously (non-blocking)
  try {
    fetch("/api/audit/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportName: safeReportName }),
    }).catch(() => {});
  } catch {
    // Ignore network errors in audit tracking
  }

  // 2. Generate CSV content
  const csvContent = generateCsvContent(headers, rows);

  // 3. Format clean filename
  const cleanBase = (filename || "export")
    .replace(/\.csv$/i, "")
    .replace(/[/\\?%*:|"<>]/g, "_")
    .trim();
  const safeFilename = `${cleanBase || "export"}.csv`;

  // 4. Trigger download
  try {
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    // Support legacy Microsoft browsers if present
    const nav = window.navigator as any;
    if (nav && typeof nav.msSaveOrOpenBlob === "function") {
      nav.msSaveOrOpenBlob(blob, safeFilename);
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", safeFilename);
    // Crucial: avoid `display: none` as it causes click cancellation in some browsers
    link.style.position = "fixed";
    link.style.top = "-9999px";
    link.style.left = "-9999px";
    link.style.opacity = "0";
    link.style.pointerEvents = "none";

    document.body.appendChild(link);

    // Trigger click synchronously
    link.click();

    // Retain link in DOM briefly before cleanup
    setTimeout(() => {
      try {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
        URL.revokeObjectURL(url);
      } catch {}
    }, 10000);
  } catch (err) {
    console.warn("Blob export failed, falling back to data URI:", err);
    try {
      const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
      const link = document.createElement("a");
      link.href = encodedUri;
      link.setAttribute("download", safeFilename);
      link.style.position = "fixed";
      link.style.top = "-9999px";
      link.style.left = "-9999px";
      link.style.opacity = "0";
      link.style.pointerEvents = "none";

      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        try {
          if (link.parentNode) {
            link.parentNode.removeChild(link);
          }
        } catch {}
      }, 10000);
    } catch (fallbackErr) {
      console.error("Client CSV export methods failed, trying server export:", fallbackErr);
      fallbackServerExport(safeFilename, safeReportName, headers, rows);
    }
  }
}

async function fallbackServerExport(
  filename: string,
  reportName: string,
  headers: unknown,
  rows: unknown
) {
  try {
    const resolvedHeaders = typeof headers === "function" ? (headers as () => unknown)() : headers;
    const resolvedRows = typeof rows === "function" ? (rows as () => unknown)() : rows;

    const res = await fetch("/api/export/csv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename,
        reportName,
        headers: resolvedHeaders,
        rows: resolvedRows,
      }),
    });

    if (!res.ok) throw new Error("Server CSV export failed");

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    link.style.position = "fixed";
    link.style.top = "-9999px";
    link.style.left = "-9999px";
    link.style.opacity = "0";
    link.style.pointerEvents = "none";
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      try {
        if (link.parentNode) link.parentNode.removeChild(link);
        URL.revokeObjectURL(url);
      } catch {}
    }, 10000);
  } catch (err) {
    console.error("All CSV export methods failed:", err);
    alert("Unable to download CSV file. Please check browser permissions.");
  }
}
