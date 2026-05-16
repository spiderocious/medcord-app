import type { Express } from 'express';

import router from './admin.routes.js';

export const register = (app: Express): void => {
  app.use('/admin', router);
};
