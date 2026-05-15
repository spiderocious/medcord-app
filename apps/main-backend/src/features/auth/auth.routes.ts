import { Router, type IRouter } from 'express';

import { asyncHandler } from '@lib/http/asyncHandler.js';
import { ResponseUtil } from '@lib/response.js';

import { LoginBody, RegisterBody } from './auth.schema.js';

const router: IRouter = Router();

// Stub endpoints — flesh out with a real auth.service.ts + auth.repo.ts that
// talk to the data-layer service. Kept here to demonstrate the feature shape.

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const body = RegisterBody.parse(req.body);
    return ResponseUtil.created(res, {
      user: { email: body.email, user_type: body.user_type },
      tokens: { access_token: 'stub.access', refresh_token: 'stub.refresh' },
    });
  }),
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const body = LoginBody.parse(req.body);
    return ResponseUtil.ok(res, {
      user: { email: body.email },
      tokens: { access_token: 'stub.access', refresh_token: 'stub.refresh' },
    });
  }),
);

router.post(
  '/refresh',
  asyncHandler(async (_req, res) =>
    ResponseUtil.ok(res, { access_token: 'stub.access', refresh_token: 'stub.refresh' }),
  ),
);

router.post(
  '/logout',
  asyncHandler(async (_req, res) => ResponseUtil.noContent(res)),
);

export default router;
