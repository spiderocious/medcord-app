import type { Express } from 'express';

import assetRoutes from './asset.routes.js';

export const register = (app: Express): void => {
  app.use('/api/v1/hospitals/:hospitalId/assets', assetRoutes);
};
