import type { Express } from 'express';

import { asyncHandler } from '@lib/http/asyncHandler.js';
import { ResponseUtil } from '@lib/response.js';
import { authenticate } from '@middlewares/auth.middleware.js';
import { hospitalScope } from '@middlewares/hospital-scope.middleware.js';

import { reviewService } from './review.service.js';
import {
  CreateReviewItemBody,
  ListReviewQueueQuery,
  ReviewActionBody,
} from './review.schema.js';

export const register = (app: Express): void => {
  app.get(
    '/api/v1/hospitals/:hospitalId/review-queue',
    authenticate,
    hospitalScope,
    asyncHandler(async (req, res) => {
      const query = ListReviewQueueQuery.parse(req.query);
      const result = await reviewService.list(req.params['hospitalId'] as string, query);
      return ResponseUtil.ok(res, result);
    }),
  );

  app.post(
    '/api/v1/hospitals/:hospitalId/review-queue',
    authenticate,
    hospitalScope,
    asyncHandler(async (req, res) => {
      const body = CreateReviewItemBody.parse(req.body);
      const item = await reviewService.create(req.params['hospitalId'] as string, req.user!.id, body);
      return ResponseUtil.created(res, { item });
    }),
  );

  app.get(
    '/api/v1/hospitals/:hospitalId/review-queue/:itemId',
    authenticate,
    hospitalScope,
    asyncHandler(async (req, res) => {
      const item = await reviewService.get(req.params['hospitalId'] as string, req.params['itemId'] as string);
      return ResponseUtil.ok(res, { item });
    }),
  );

  app.post(
    '/api/v1/hospitals/:hospitalId/review-queue/:itemId/act',
    authenticate,
    hospitalScope,
    asyncHandler(async (req, res) => {
      const body = ReviewActionBody.parse(req.body);
      const item = await reviewService.act(
        req.params['hospitalId'] as string,
        req.params['itemId'] as string,
        req.user!.id,
        body,
      );
      return ResponseUtil.ok(res, { item });
    }),
  );
};
