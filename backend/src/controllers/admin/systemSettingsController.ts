import { Request, Response } from 'express';
import { SystemSettings } from '../../models/SystemSettings';
import { logger } from '../../utils/logger';

/**
 * Get all system settings
 */
export const getSystemSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await SystemSettings.find();
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    logger.error('Get system settings failed', { error });
    res.status(500).json({ success: false, message: 'Failed to get system settings' });
  }
};

/**
 * Get a specific system setting by key
 */
export const getSettingByKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    const setting = await SystemSettings.findOne({ key });
    
    if (!setting) {
      res.status(404).json({ success: false, message: 'Setting not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: setting
    });
  } catch (error) {
    logger.error('Get setting by key failed', { error, key: req.params.key });
    res.status(500).json({ success: false, message: 'Failed to get setting' });
  }
};

/**
 * Update or create a system setting
 */
export const updateSystemSetting = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key, value, description, category } = req.body;

    const setting = await SystemSettings.findOneAndUpdate(
      { key },
      { value, description, category },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'System setting updated successfully',
      data: setting
    });
  } catch (error) {
    logger.error('Update system setting failed', { error });
    res.status(500).json({ success: false, message: 'Failed to update system setting' });
  }
};

/**
 * Get metrics for the home page (aggregated or from settings)
 */
export const getHomeMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const metricsKeys = ['total_placements', 'active_users_count', 'jobs_posted_count', 'partner_companies_count'];
    const settings = await SystemSettings.find({ key: { $in: metricsKeys } });
    
    const metrics: Record<string, any> = {};
    settings.forEach(s => {
      metrics[s.key] = s.value;
    });

    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Get home metrics failed', { error });
    res.status(500).json({ success: false, message: 'Failed to get metrics' });
  }
};
