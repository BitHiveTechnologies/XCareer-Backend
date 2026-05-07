import { Router } from 'express';
import { 
  listLogos, 
  uploadLogo, 
  deleteLogo 
} from '../../controllers/admin/logoController';
import { authenticate, requireAdmin } from '../../middleware/jwtAuth';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/', listLogos);
router.post('/upload', uploadLogo);
router.delete('/', deleteLogo);

export default router;
