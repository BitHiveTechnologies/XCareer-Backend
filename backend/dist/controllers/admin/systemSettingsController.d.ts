import { Request, Response } from 'express';
/**
 * Get all system settings
 */
export declare const getSystemSettings: (req: Request, res: Response) => Promise<void>;
/**
 * Get a specific system setting by key
 */
export declare const getSettingByKey: (req: Request, res: Response) => Promise<void>;
/**
 * Update or create a system setting
 */
export declare const updateSystemSetting: (req: Request, res: Response) => Promise<void>;
/**
 * Get metrics for the home page (aggregated or from settings)
 */
export declare const getHomeMetrics: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=systemSettingsController.d.ts.map