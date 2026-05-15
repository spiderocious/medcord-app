import type { Express } from 'express';

import emrRoutes from './emr.routes.js';

export const register = (app: Express): void => {
  app.use('/api/v1/hospitals/:hospitalId/patients/:patientId', emrRoutes);
};
