import { Request, Response } from 'express';
import { UserProvisioningData, UserProvisioningService } from '../services/userProvisioningService';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'user' | 'admin' | 'super_admin';
    type: 'user' | 'admin';
  };
}

/**
 * Provision a new user (Admin only)
 */
export const provisionUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userData: UserProvisioningData = req.body;

    // Validate required fields
    if (!userData.email || !userData.name) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Email and name are required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const result = await UserProvisioningService.provisionUser(userData);

    if (result.success) {
      logger.info('User provisioned successfully', {
        userId: result.user?._id,
        email: userData.email,
        adminId: req.user?.id
      });

      res.status(201).json({
        success: true,
        message: 'User provisioned successfully',
        data: {
          user: result.user,
          profile: result.profile,
          subscription: result.subscription,
          warnings: result.warnings
        },
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        error: {
          message: 'User provisioning failed',
          details: result.errors
        },
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('User provisioning failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to provision user'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Bulk provision users (Admin only)
 */
export const bulkProvisionUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { users } = req.body;

    if (!Array.isArray(users) || users.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Users array is required and must not be empty'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (users.length > 100) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Maximum 100 users can be provisioned at once'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const results = await UserProvisioningService.bulkProvisionUsers(users);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    logger.info('Bulk user provisioning completed', {
      total: users.length,
      successful,
      failed,
      adminId: req.user?.id
    });

    res.status(200).json({
      success: true,
      message: 'Bulk provisioning completed',
      data: {
        total: users.length,
        successful,
        failed,
        results
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Bulk user provisioning failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to bulk provision users'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get provisioning statistics (Admin only)
 */
export const getProvisioningStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stats = await UserProvisioningService.getProvisioningStats();

    res.status(200).json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get provisioning stats failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get provisioning statistics'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Provision user from external system (Admin only)
 */
export const provisionFromExternal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { source, data } = req.body;

    if (!source || !data) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Source and data are required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    let userData: UserProvisioningData;

    // Transform data based on source
    switch (source) {
      case 'razorpay':
        userData = {
          email: data.customer?.email || data.email,
          name: data.customer?.name || 'User',
          mobile: data.customer?.contact || '0000000000',
          subscriptionPlan: data.plan || 'basic',
          subscriptionStatus: 'active',
          metadata: {
            source: 'razorpay_webhook',
            campaign: 'payment_webhook',
            notes: `Payment ID: ${data.payment_id}`
          }
        };
        break;
      case 'clerk':
        userData = {
          email: data.email_addresses?.[0]?.email_address || data.email,
          name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'User',
          clerkUserId: data.id,
          subscriptionPlan: 'basic',
          subscriptionStatus: 'inactive',
          metadata: {
            source: 'clerk_auth',
            campaign: 'external_auth',
            notes: `Clerk ID: ${data.id}`
          }
        };
        break;
      case 'csv_import':
        userData = {
          email: data.email,
          name: data.name,
          mobile: data.mobile,
          subscriptionPlan: data.subscriptionPlan || 'basic',
          subscriptionStatus: data.subscriptionStatus || 'inactive',
          profileData: {
            firstName: data.firstName,
            lastName: data.lastName,
            qualification: data.qualification,
            stream: data.stream,
            yearOfPassout: data.yearOfPassout,
            cgpaOrPercentage: data.cgpaOrPercentage,
            collegeName: data.collegeName
          },
          metadata: {
            source: 'csv_import',
            campaign: 'bulk_import',
            notes: `Imported from CSV`
          }
        };
        break;
      default:
        res.status(400).json({
          success: false,
          error: {
            message: 'Unsupported source type'
          },
          timestamp: new Date().toISOString()
        });
        return;
    }

    const result = await UserProvisioningService.provisionUser(userData);

    if (result.success) {
      logger.info('User provisioned from external source', {
        userId: result.user?._id,
        email: userData.email,
        source,
        adminId: req.user?.id
      });

      res.status(201).json({
        success: true,
        message: 'User provisioned successfully from external source',
        data: {
          user: result.user,
          profile: result.profile,
          subscription: result.subscription,
          warnings: result.warnings
        },
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        error: {
          message: 'User provisioning failed',
          details: result.errors
        },
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('External user provisioning failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      source: req.body.source,
      adminId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to provision user from external source'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Test user provisioning (Admin only)
 */
export const testProvisioning = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const testData: UserProvisioningData = {
      email: `test_${Date.now()}@example.com`,
      name: 'Test User',
      mobile: '9876543210',
      subscriptionPlan: 'basic',
      subscriptionStatus: 'active',
      profileData: {
        firstName: 'Test',
        lastName: 'User',
        qualification: 'B.Tech',
        stream: 'CSE',
        yearOfPassout: 2023,
        cgpaOrPercentage: 8.5,
        collegeName: 'Test College'
      },
      metadata: {
        source: 'test_provisioning',
        campaign: 'admin_test',
        notes: 'Test provisioning by admin'
      }
    };

    const result = await UserProvisioningService.provisionUser(testData);

    if (result.success) {
      logger.info('Test user provisioning successful', {
        userId: result.user?._id,
        adminId: req.user?.id
      });

      res.status(200).json({
        success: true,
        message: 'Test provisioning successful',
        data: {
          user: result.user,
          profile: result.profile,
          subscription: result.subscription,
          warnings: result.warnings
        },
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        error: {
          message: 'Test provisioning failed',
          details: result.errors
        },
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Test provisioning failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to test provisioning'
      },
      timestamp: new Date().toISOString()
    });
  }
};
