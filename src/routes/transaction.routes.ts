import { Router } from 'express';
import { transactionController } from '../controllers/transaction.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createTransactionSchema,
  updateTransactionSchema,
  filterTransactionsSchema,
} from '../validators/transaction.validator';

const router = Router();

router.get(
  '/statistics',
  authenticate,
  transactionController.getStatistics.bind(transactionController)
);

router.get(
  '/by-category',
  authenticate,
  transactionController.getByCategory.bind(transactionController)
);

router.get(
  '/by-period',
  authenticate,
  transactionController.getByPeriod.bind(transactionController)
);

router.get(
  '/',
  authenticate,
  validate(filterTransactionsSchema, 'query'),
  transactionController.getTransactions.bind(transactionController)
);

router.get(
  '/:id',
  authenticate,
  transactionController.getTransactionById.bind(transactionController)
);

router.post(
  '/',
  authenticate,
  validate(createTransactionSchema),
  transactionController.createTransaction.bind(transactionController)
);

router.put(
  '/:id',
  authenticate,
  validate(updateTransactionSchema),
  transactionController.updateTransaction.bind(transactionController)
);

router.delete(
  '/:id',
  authenticate,
  transactionController.deleteTransaction.bind(transactionController)
);

export default router;
