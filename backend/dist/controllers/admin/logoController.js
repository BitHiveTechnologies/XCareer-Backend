"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLogo = exports.uploadLogo = exports.listLogos = void 0;
const logger_1 = require("../../utils/logger");
// Mock database of logos (in a real app, this would be a model or S3 bucket list)
let logos = [];
/**
 * List all uploaded company logos
 */
const listLogos = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: logos
        });
    }
    catch (error) {
        logger_1.logger.error('List logos failed', { error });
        res.status(500).json({ success: false, message: 'Failed to list logos' });
    }
};
exports.listLogos = listLogos;
/**
 * Upload a company logo (Mock implementation)
 */
const uploadLogo = async (req, res) => {
    try {
        // In a real implementation, we would use multer and upload to S3/Cloudinary
        // For now, we'll expect a URL in the body for testing, or mock it.
        const { logoUrl } = req.body;
        if (!logoUrl) {
            res.status(400).json({ success: false, message: 'Logo URL is required' });
            return;
        }
        logos.push(logoUrl);
        res.status(201).json({
            success: true,
            message: 'Logo uploaded successfully (mock)',
            data: { url: logoUrl }
        });
    }
    catch (error) {
        logger_1.logger.error('Upload logo failed', { error });
        res.status(500).json({ success: false, message: 'Failed to upload logo' });
    }
};
exports.uploadLogo = uploadLogo;
/**
 * Delete a logo
 */
const deleteLogo = async (req, res) => {
    try {
        const { url } = req.body;
        logos = logos.filter(l => l !== url);
        res.status(200).json({
            success: true,
            message: 'Logo deleted successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Delete logo failed', { error });
        res.status(500).json({ success: false, message: 'Failed to delete logo' });
    }
};
exports.deleteLogo = deleteLogo;
//# sourceMappingURL=logoController.js.map