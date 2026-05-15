import type { Express } from 'express';

import hospitalRoutes from './hospital.routes.js';

export const register = (app: Express): void => {
  app.use('/api/v1/hospitals', hospitalRoutes);
};
