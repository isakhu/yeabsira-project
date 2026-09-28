interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const statusStyles: Record<string, string> = {
  // Vehicle statuses
  IDLE: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  FIELD_WORK: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  GARAGE: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  OUT_OF_SERVICE: "bg-red-500/10 text-red-400 border-red-500/20",

  // General statuses
  ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  INACTIVE: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  SUSPENDED: "bg-red-500/10 text-red-400 border-red-500/20",

  // Booking/Assignment statuses
  PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
  COMPLETED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  CANCELLED: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  SCHEDULED: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  IN_PROGRESS: "bg-brand-gold/10 text-brand-gold border-brand-gold/20",

  // Maintenance
  LOW: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  MEDIUM: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  HIGH: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  CRITICAL: "bg-red-500/10 text-red-400 border-red-500/20",

  // Service
  OVERDUE: "bg-red-500/10 text-red-400 border-red-500/20",
};

const statusLabels: Record<string, string> = {
  IDLE: "Idle",
  FIELD_WORK: "Field Work",
  GARAGE: "Garage",
  OUT_OF_SERVICE: "Out of Service",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  SUSPENDED: "Suspended",
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In Progress",
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
  OVERDUE: "Overdue",
};

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const style = statusStyles[status] || "bg-gray-500/10 text-gray-400 border-gray-500/20";
  const label = statusLabels[status] || status;
  const sizeClass = size === "sm" ? "text-xs px-2.5 py-1" : "text-sm px-3 py-1.5";

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${style} ${sizeClass}`}>
      {label}
    </span>
  );
}
