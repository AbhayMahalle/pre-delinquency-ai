import type { AuditLog, AuditLogType } from "@/types";
import { addAuditLog } from "./storage";

let _currentUser = "system";
export const setCurrentUser = (u: string) => { _currentUser = u; };

function genId(): string {
  return `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function log(
  type: AuditLogType,
  description: string,
  metadata: Record<string, unknown> = {}
) {
  const entry: AuditLog = {
    logId: genId(),
    type,
    actor: _currentUser,
    description,
    timestamp: new Date().toISOString(),
    metadata,
  };
  addAuditLog(entry);
}
