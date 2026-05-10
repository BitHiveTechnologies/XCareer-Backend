"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHomeMetrics = exports.updateSystemSetting = exports.getSettingByKey = exports.getSystemSettings = void 0;
const SystemSettings_1 = require("../../models/SystemSettings");
const logger_1 = require("../../utils/logger");
/**
 * Get all system settings
 */
const getSystemSettings = async (req, res) => {
    try {
        const settings = await SystemSettings_1.SystemSettings.find();
        res.status(200).json({
            success: true,
            data: settings
        });
    }
    catch (error) {
        logger_1.logger.error('Get system settings failed', { error });
        res.status(500).json({ success: false, message: 'Failed to get system settings' });
    }
};
exports.getSystemSettings = getSystemSettings;
/**
 * Get a specific system setting by key
 */
const getSettingByKey = async (req, res) => {
    try {
        const { key } = req.params;
        const setting = await SystemSettings_1.SystemSettings.findOne({ key });
        if (!setting) {
            res.status(404).json({ success: false, message: 'Setting not found' });
            return;
        }
        res.status(200).json({
            success: true,
            data: setting
        });
    }
    catch (error) {
        logger_1.logger.error('Get setting by key failed', { error, key: req.params.key });
        res.status(500).json({ success: false, message: 'Failed to get setting' });
    }
};
exports.getSettingByKey = getSettingByKey;
/**
 * Update or create a system setting
 */
const updateSystemSetting = async (req, res) => {
    try {
        const { key, value, description, category } = req.body;
        const setting = await SystemSettings_1.SystemSettings.findOneAndUpdate({ key }, { value, description, category }, { new: true, upsert: true });
        res.status(200).json({
            success: true,
            message: 'System setting updated successfully',
            data: setting
        });
    }
    catch (error) {
        logger_1.logger.error('Update system setting failed', { error });
        res.status(500).json({ success: false, message: 'Failed to update system setting' });
    }
};
exports.updateSystemSetting = updateSystemSetting;
/**
 * Get metrics for the home page (aggregated or from settings)
 */
const getHomeMetrics = async (req, res) => {
    try {
        const metricsKeys = ['total_placements', 'active_users_count', 'jobs_posted_count', 'partner_companies_count'];
        const settings = await SystemSettings_1.SystemSettings.find({ key: { $in: metricsKeys } });
        const metrics = {};
        settings.forEach(s => {
            metrics[s.key] = s.value;
        });
        res.status(200).json({
            success: true,
            data: metrics
        });
    }
    catch (error) {
        logger_1.logger.error('Get home metrics failed', { error });
        res.status(500).json({ success: false, message: 'Failed to get metrics' });
    }
};
exports.getHomeMetrics = getHomeMetrics;
//# sourceMappingURL=systemSettingsController.js.map