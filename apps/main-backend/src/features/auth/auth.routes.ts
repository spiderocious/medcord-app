import { Router, type IRouter } from 'express';

import { asyncHandler } from '@lib/http/asyncHandler.js';
import { ResponseUtil } from '@lib/response.js';
import { authenticate } from '@middlewares/auth.middleware.js';

import { authService } from './auth.service.js';
import {
  ChangePasswordBody,
  GenerateResetCodeBody,
  LoginBody,
  LogoutBody,
  RefreshBody,
  RegisterBody,
  ResetPasswordBody,
  UpdateMeBody,
  Verify2faBody,
  VerifyResetCodeBody,
} from './auth.schema.js';

const router: IRouter = Router();

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const body = RegisterBody.parse(req.body);
    const result = await authService.register(body);
    return ResponseUtil.created(res, result);
  }),
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const body = LoginBody.parse(req.body);
    const result = await authService.login(body);
    return ResponseUtil.ok(res, result);
  }),
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const body = RefreshBody.parse(req.body);
    const result = await authService.refresh(body);
    return ResponseUtil.ok(res, result);
  }),
);

router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    const body = LogoutBody.parse(req.body);
    await authService.logout(req.user!.id, body);
    return ResponseUtil.noContent(res);
  }),
);

router.post(
  '/setup-2fa',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await authService.setup2fa(req.user!.id);
    return ResponseUtil.ok(res, result);
  }),
);

router.post(
  '/verify-2fa',
  authenticate,
  asyncHandler(async (req, res) => {
    const body = Verify2faBody.parse(req.body);
    await authService.verify2fa(req.user!.id, body);
    return ResponseUtil.noContent(res);
  }),
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await authService.getMe(req.user!.id);
    return ResponseUtil.ok(res, { user });
  }),
);

router.patch(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const body = UpdateMeBody.parse(req.body);
    const user = await authService.updateMe(req.user!.id, body);
    return ResponseUtil.ok(res, { user });
  }),
);

router.patch(
  '/me/password',
  authenticate,
  asyncHandler(async (req, res) => {
    const body = ChangePasswordBody.parse(req.body);
    await authService.changePassword(req.user!.id, body);
    return ResponseUtil.noContent(res);
  }),
);

router.post(
  '/generate-reset-code',
  authenticate,
  asyncHandler(async (req, res) => {
    const body = GenerateResetCodeBody.parse(req.body);
    const result = await authService.generateResetCode(req.user!.id, body);
    return ResponseUtil.ok(res, result);
  }),
);

router.post(
  '/verify-reset-code',
  asyncHandler(async (req, res) => {
    const body = VerifyResetCodeBody.parse(req.body);
    const result = await authService.verifyResetCode(body);
    return ResponseUtil.ok(res, result);
  }),
);

router.post(
  '/reset-password',
  asyncHandler(async (req, res) => {
    const body = ResetPasswordBody.parse(req.body);
    await authService.resetPassword(body);
    return ResponseUtil.noContent(res);
  }),
);

export default router;
