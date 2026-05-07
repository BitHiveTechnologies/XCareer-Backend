import { Router } from 'express';
import { 
  getSystemSettings, 
  updateSystemSetting, 
  getSettingByKey,
  getHomeMetrics
} from '../../controllers/admin/systemSettingsController';
import { authenticate, requireAdmin } from '../../middleware/jwtAuth';

const router = Router();

// Public routes (metrics for home page)
router.get('/metrics', getHomeMetrics);

// Admin routes
router.use(authenticate);
router.use(requireAdmin);

router.get('/', getSystemSettings);
router.get('/:key', getSettingByKey);
router.post('/', updateSystemSetting);

export default router;
