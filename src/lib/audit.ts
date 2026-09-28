import { prisma } from "./prisma";

export type AuditAction =
  | "LOGIN"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "PASSWORD_CHANGE"
  | "USER_CREATE"
  | "USER_ACTIVATE"
  | "USER_DEACTIVATE"
  | "EMPLOYEE_CREATE"
  | "EMPLOYEE_UPDATE"
  | "EMPLOYEE_STATUS_CHANGE"
  | "DRIVER_CREATE"
  | "DRIVER_UPDATE"
  | "DRIVER_STATUS_CHANGE"
  | "DRIVER_ASSIGN"
  | "DRIVER_UNASSIGN"
  | "VEHICLE_CREATE"
  | "VEHICLE_UPDATE"
  | "VEHICLE_STATUS_CHANGE"
  | "BOOKING_CREATE"
  | "BOOKING_APPROVE"
  | "BOOKING_REJECT"
  | "ASSIGNMENT_CREATE"
  | "ASSIGNMENT_UPDATE"
  | "MAINTENANCE_CREATE"
  | "MAINTENANCE_UPDATE"
  | "MAINTENANCE_COMPLETE"
  | "SERVICE_SCHEDULE"
  | "SERVICE_UPDATE"
  | "DRIVER_BEHAVIOR_LOG"
  | "FUEL_TRANSACTION_CREATE"
  | "ADMIN_SETTINGS_CHANGE";

export async function logAction(
  userId: string,
  action: AuditAction,
  target?: string,
  details?: Record<string, unknown>,
  ipAddress?: string
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        target: target ?? null,
        details: details ? JSON.stringify(details) : null,
        ipAddress: ipAddress ?? null,
      },
    });
  } catch (error) {
    // Audit logging should never crash the application
    console.error("Audit log error:", error);
  }
}
