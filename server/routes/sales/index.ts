import { Express } from 'express';
import { registerDashboardRoutes } from './sales-dashboard';
import { registerChartsRoutes } from './sales-charts';
import { registerRankingRoutes } from './sales-ranking';
import { registerProductsRoutes } from './sales-products';
import { registerGoalsRoutes } from './sales-goals';
import { registerForecastRoutes } from './sales-forecast';
import { registerConversionRoutes } from './sales-conversion';

export function registerSalesRoutes(app: Express) {
  registerDashboardRoutes(app);
  registerChartsRoutes(app);
  registerRankingRoutes(app);
  registerProductsRoutes(app);
  registerGoalsRoutes(app);
  registerForecastRoutes(app);
  registerConversionRoutes(app);
}