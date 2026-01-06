import 'reflect-metadata';
import { Container } from 'inversify';

// Repositories
import { ITransactionRepository } from '../repositories/interfaces/ITransactionRepository';
import { ICategoryRepository } from '../repositories/interfaces/ICategoryRepository';
import { IGoalRepository } from '../repositories/interfaces/IGoalRepository';
import { IAlertRepository } from '../repositories/interfaces/IAlertRepository';
import { MongoTransactionRepository } from '../repositories/MongoTransactionRepository';
import { MongoCategoryRepository } from '../repositories/MongoCategoryRepository';
import { MongoGoalRepository } from '../repositories/MongoGoalRepository';
import { MongoAlertRepository } from '../repositories/MongoAlertRepository';

// Services
import { ITransactionService } from '../services/interfaces/ITransactionService';
import { ITransactionAnalyticsService } from '../services/interfaces/ITransactionAnalyticsService';
import { ICategoryService } from '../services/interfaces/ICategoryService';
import { IGoalService } from '../services/interfaces/IGoalService';
import { TransactionService, TYPES } from '../services/TransactionService';
import { TransactionAnalyticsService } from '../services/TransactionAnalyticsService';
import { CategoryService } from '../services/CategoryService';
import { GoalService } from '../services/GoalService';

// Alert Checkers
import { IAlertChecker } from '../core/alerts/interfaces/IAlertChecker';
import { OverspendingAlertChecker } from '../core/alerts/checkers/OverspendingAlertChecker';
import { GoalProgressAlertChecker } from '../core/alerts/checkers/GoalProgressAlertChecker';
import { UnusualPatternAlertChecker } from '../core/alerts/checkers/UnusualPatternAlertChecker';
import { RecommendationAlertChecker } from '../core/alerts/checkers/RecommendationAlertChecker';
import { AlertOrchestrator } from '../core/alerts/AlertOrchestrator';

const container = new Container();

// ========== REPOSITORIES ==========
container.bind<ITransactionRepository>(TYPES.ITransactionRepository).to(MongoTransactionRepository).inSingletonScope();

container
  .bind<ICategoryRepository>(Symbol.for('ICategoryRepository'))
  .to(MongoCategoryRepository)
  .inSingletonScope();

container.bind<IGoalRepository>(Symbol.for('IGoalRepository')).to(MongoGoalRepository).inSingletonScope();

container.bind<IAlertRepository>(Symbol.for('IAlertRepository')).to(MongoAlertRepository).inSingletonScope();

// ========== SERVICES ==========
container
  .bind<ITransactionService>(Symbol.for('ITransactionService'))
  .to(TransactionService)
  .inSingletonScope();

container
  .bind<ITransactionAnalyticsService>(Symbol.for('ITransactionAnalyticsService'))
  .to(TransactionAnalyticsService)
  .inSingletonScope();

container
  .bind<ICategoryService>(Symbol.for('ICategoryService'))
  .to(CategoryService)
  .inSingletonScope();

container
  .bind<IGoalService>(Symbol.for('IGoalService'))
  .to(GoalService)
  .inSingletonScope();

// ========== ALERT CHECKERS ==========
container
  .bind<IAlertChecker>(Symbol.for('IAlertChecker'))
  .to(OverspendingAlertChecker)
  .inSingletonScope();

container
  .bind<IAlertChecker>(Symbol.for('IAlertChecker'))
  .to(GoalProgressAlertChecker)
  .inSingletonScope();

container
  .bind<IAlertChecker>(Symbol.for('IAlertChecker'))
  .to(UnusualPatternAlertChecker)
  .inSingletonScope();

container
  .bind<IAlertChecker>(Symbol.for('IAlertChecker'))
  .to(RecommendationAlertChecker)
  .inSingletonScope();

// ========== ALERT ORCHESTRATOR ==========
container.bind<AlertOrchestrator>(Symbol.for('AlertOrchestrator')).to(AlertOrchestrator).inSingletonScope();

export { container };
