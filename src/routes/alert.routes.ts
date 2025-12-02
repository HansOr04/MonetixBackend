import { Router } from 'express';
import { alertController } from '../controllers/alert.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get(
  '/unread-count',
  authenticate,
  alertController.getUnreadCount.bind(alertController)
);

router.get(
  '/',
  authenticate,
  alertController.getAlerts.bind(alertController)
);

router.get(
  '/:id',
  authenticate,
  alertController.getAlertById.bind(alertController)
);

router.put(
  '/:id/read',
  authenticate,
  alertController.markAsRead.bind(alertController)
);

router.put(
  '/read-all',
  authenticate,
  alertController.markAllAsRead.bind(alertController)
);

router.delete(
  '/:id',
  authenticate,
  alertController.deleteAlert.bind(alertController)
);

router.post(
  '/generate',
  authenticate,
  alertController.generateAlerts.bind(alertController)
);

export default router;
