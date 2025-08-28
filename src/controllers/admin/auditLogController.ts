import { Request, Response } from 'express';
import { logger } from '../../utils/logger';

// Extend Request to include user from Clerk middleware
interface AdminRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: 'user' | 'admin' | 'super_admin';
    type: 'user' | 'admin';
    clerkUserId: string;
    metadata?: Record<string, any>;
  };
}

// Audit log interface
interface AuditLogEntry {
  adminId: string;
  adminEmail: string;
  adminRole: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent?: string;
  timestamp: Date;
}

// In-memory audit log storage (in production, this should be a database)
class AuditLogService {
  private logs: AuditLogEntry[] = [];
  private maxLogs = 10000; // Keep last 10,000 logs

  addLog(entry: AuditLogEntry): void {
    this.logs.push(entry);
    
    // Remove oldest logs if we exceed maxLogs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Also log to the main logger
    logger.info('Admin action logged', {
      adminId: entry.adminId,
      adminEmail: entry.adminEmail,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      ip: entry.ipAddress
    });
  }

  getLogs(filters: {
    adminId?: string;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): AuditLogEntry[] {
    let filteredLogs = [...this.logs];

    if (filters.adminId) {
      filteredLogs = filteredLogs.filter(log => log.adminId === filters.adminId);
    }

    if (filters.action) {
      filteredLogs = filteredLogs.filter(log => log.action === filters.action);
    }

    if (filters.resourceType) {
      filteredLogs = filteredLogs.filter(log => log.resourceType === filters.resourceType);
    }

    if (filters.startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate!);
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 100;

    return filteredLogs.slice(offset, offset + limit);
  }

  getLogCount(filters: {
    adminId?: string;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
  }): number {
    return this.getLogs(filters).length;
  }

  getRecentActivity(limit: number = 50): AuditLogEntry[] {
    return this.logs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getAdminActivity(adminId: string, limit: number = 100): AuditLogEntry[] {
    return this.logs
      .filter(log => log.adminId === adminId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getResourceActivity(resourceType: string, resourceId: string, limit: number = 100): AuditLogEntry[] {
    return this.logs
      .filter(log => log.resourceType === resourceType && log.resourceId === resourceId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

export const auditLogService = new AuditLogService();

/**
 * Get audit logs with filtering and pagination
 */
export const getAuditLogs = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const adminRole = req.user?.role;

    if (!adminId || !['admin', 'super_admin'].includes(adminRole || '')) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Admin access required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const {
      page = 1,
      limit = 50,
      adminId: filterAdminId = '',
      action = '',
      resourceType = '',
      startDate = '',
      endDate = '',
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    // Build filters
    const filters: any = {};
    if (filterAdminId) filters.adminId = filterAdminId;
    if (action) filters.action = action;
    if (resourceType) filters.resourceType = resourceType;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    // Get logs
    const logs = auditLogService.getLogs({ ...filters, limit: limitNum, offset });
    const totalLogs = auditLogService.getLogCount(filters);

    // Calculate pagination info
    const totalPages = Math.ceil(totalLogs / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    logger.info('Admin retrieved audit logs', {
      adminId,
      adminRole,
      totalLogs,
      page: pageNum,
      limit: limitNum,
      filters,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalLogs,
          hasNextPage,
          hasPrevPage,
          limit: limitNum
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get audit logs failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get audit logs'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get recent admin activity
 */
export const getRecentActivity = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const adminRole = req.user?.role;

    if (!adminId || !['admin', 'super_admin'].includes(adminRole || '')) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Admin access required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { limit = 50 } = req.query;
    const limitNum = parseInt(limit as string, 10);

    const recentActivity = auditLogService.getRecentActivity(limitNum);

    logger.info('Admin retrieved recent activity', {
      adminId,
      adminRole,
      limit: limitNum,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        recentActivity,
        total: recentActivity.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get recent activity failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get recent activity'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get specific admin's activity
 */
export const getAdminActivity = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const adminRole = req.user?.role;
    const { targetAdminId } = req.params;

    if (!adminId || !['admin', 'super_admin'].includes(adminRole || '')) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Admin access required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { limit = 100 } = req.query;
    const limitNum = parseInt(limit as string, 10);

    const adminActivity = auditLogService.getAdminActivity(targetAdminId, limitNum);

    logger.info('Admin retrieved specific admin activity', {
      adminId,
      adminRole,
      targetAdminId,
      limit: limitNum,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        adminId: targetAdminId,
        activity: adminActivity,
        total: adminActivity.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get admin activity failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      targetAdminId: req.params.targetAdminId,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get admin activity'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get resource activity history
 */
export const getResourceActivity = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const adminRole = req.user?.role;
    const { resourceType, resourceId } = req.params;

    if (!adminId || !['admin', 'super_admin'].includes(adminRole || '')) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Admin access required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { limit = 100 } = req.query;
    const limitNum = parseInt(limit as string, 10);

    const resourceActivity = auditLogService.getResourceActivity(resourceType, resourceId, limitNum);

    logger.info('Admin retrieved resource activity', {
      adminId,
      adminRole,
      resourceType,
      resourceId,
      limit: limitNum,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        resourceType,
        resourceId,
        activity: resourceActivity,
        total: resourceActivity.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get resource activity failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      resourceType: req.params.resourceType,
      resourceId: req.params.resourceId,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get resource activity'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Export audit logs (CSV format)
 */
export const exportAuditLogs = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const adminRole = req.user?.role;

    if (!adminId || !['admin', 'super_admin'].includes(adminRole || '')) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Admin access required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const {
      adminId: filterAdminId = '',
      action = '',
      resourceType = '',
      startDate = '',
      endDate = ''
    } = req.query;

    // Build filters
    const filters: any = {};
    if (filterAdminId) filters.adminId = filterAdminId;
    if (action) filters.action = action;
    if (resourceType) filters.resourceType = resourceType;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    // Get all logs matching filters
    const logs = auditLogService.getLogs(filters);

    // Generate CSV content
    const csvHeaders = [
      'Timestamp',
      'Admin ID',
      'Admin Email',
      'Admin Role',
      'Action',
      'Resource Type',
      'Resource ID',
      'Details',
      'IP Address',
      'User Agent'
    ];

    const csvRows = logs.map(log => [
      log.timestamp.toISOString(),
      log.adminId,
      log.adminEmail,
      log.adminRole,
      log.action,
      log.resourceType,
      log.resourceId || '',
      JSON.stringify(log.details),
      log.ipAddress,
      log.userAgent || ''
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);

    logger.info('Admin exported audit logs', {
      adminId,
      adminRole,
      filters,
      totalExported: logs.length,
      ip: req.ip
    });

    res.status(200).send(csvContent);
  } catch (error) {
    logger.error('Export audit logs failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to export audit logs'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Utility function to log admin actions (used by other controllers)
 */
export const logAdminAction = (
  adminId: string,
  adminEmail: string,
  adminRole: string,
  action: string,
  resourceType: string,
  resourceId: string | undefined,
  details: Record<string, any>,
  ipAddress: string,
  userAgent?: string
): void => {
  const logEntry: AuditLogEntry = {
    adminId,
    adminEmail,
    adminRole,
    action,
    resourceType,
    resourceId,
    details,
    ipAddress,
    userAgent,
    timestamp: new Date()
  };

  auditLogService.addLog(logEntry);
};
