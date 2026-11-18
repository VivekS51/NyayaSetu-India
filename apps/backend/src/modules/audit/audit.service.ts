import { v4 as uuidv4 } from 'uuid';
import { dbStore, AuditLogRecord } from '../../config/database';

export class AuditService {
  public static async log(entry: {
    userId?: string | null;
    action: string;
    resourceType: string;
    resourceId: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    diffPayload?: any;
  }): Promise<AuditLogRecord> {
    const record: AuditLogRecord = {
      id: uuidv4(),
      userId: entry.userId || null,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      ipAddress: entry.ipAddress || null,
      userAgent: entry.userAgent || null,
      diffPayload: entry.diffPayload || null,
      createdAt: new Date(),
    };

    dbStore.auditLogs.push(record);
    return record;
  }

  public async getAuditLogs(page: number = 1, limit: number = 20, resourceType?: string) {
    let logs = dbStore.auditLogs.slice();

    if (resourceType) {
      logs = logs.filter((l) => l.resourceType.toLowerCase() === resourceType.toLowerCase());
    }

    logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = logs.length;
    const startIndex = (page - 1) * limit;
    const items = logs.slice(startIndex, startIndex + limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

