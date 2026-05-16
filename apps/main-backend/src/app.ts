import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { register as registerAuth } from '@features/auth/index.js';
import { register as registerHealth } from '@features/health/index.js';
import { register as registerHospitals } from '@features/hospitals/index.js';
import { register as registerStaff } from '@features/staff/index.js';
import { register as registerPatients } from '@features/patients/index.js';
import { register as registerEmr } from '@features/emr/index.js';
import { register as registerLabs } from '@features/labs/index.js';
import { register as registerAssets } from '@features/assets/index.js';
import { register as registerReviewQueue } from '@features/review-queue/index.js';
import { register as registerAuditLog } from '@features/audit-log/index.js';
import { register as registerNotifications } from '@features/notifications/index.js';
import { register as registerSearch } from '@features/search/index.js';
import { errorHandler } from '@middlewares/errorHandler.middleware.js';
import { requestIdMiddleware } from '@middlewares/requestId.middleware.js';
import { requestLogMiddleware } from '@middlewares/requestLog.middleware.js';

import { env } from './env.js';

const features = [
  registerHealth,
  registerAuth,
  registerHospitals,
  registerStaff,
  registerPatients,
  registerEmr,
  registerLabs,
  registerAssets,
  registerReviewQueue,
  registerAuditLog,
  registerNotifications,
  registerSearch,
];

export const buildApp = (): express.Express => {
  const app = express();

  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: "*",
    }),
  );

  app.use(requestIdMiddleware);
  app.use(requestLogMiddleware);

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(compression());

  features.forEach((register) => register(app));

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'not_found', message: 'Route not found' } });
  });

  app.use(errorHandler);

  return app;
};
