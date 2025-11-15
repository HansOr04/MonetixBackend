import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
} from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requiredAdmin } from '../middlewares/admin.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createUserSchema,
  updateUserSchema,
  updatePasswordSchema,
} from '../validators/user.validator';

const router = Router();

router.use(authenticate, requiredAdmin);

router.get('/', getAllUsers);

router.get('/:id', getUserById);

router.post('/', validate(createUserSchema), createUser);

router.put('/:id', validate(updateUserSchema), updateUser);

router.delete('/:id', deleteUser);

router.patch('/:id/password', validate(updatePasswordSchema), changePassword);

export default router;