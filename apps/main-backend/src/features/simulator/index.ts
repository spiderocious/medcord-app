import type { Express } from 'express';

import simulatorRoutes from './simulator.routes.js';

export const register = (app: Express): void => {
  app.use('/api/v1/simulator', simulatorRoutes);
};
