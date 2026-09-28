import { ReactNode } from "react";

interface Column {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  emptyMessage?: string;
}

export default function DataTable({
  columns,
  data,
  emptyMessage = "No data available",
}: DataTableProps) {
  if (data.length === 0) {
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-2xl p-12 text-center">
        <i className="fas fa-inbox text-3xl text-gray-500 mb-4"></i>
        <p className="text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 border border-slate-600 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-600">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {data.map((row, i) => (
              <tr
                key={i}
                className="hover:bg-slate-700/50 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4 text-sm text-gray-300 whitespace-nowrap">
                    {col.render
                      ? col.render(row[col.key], row)
                      : (row[col.key] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
