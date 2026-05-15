import { Router, type IRouter } from 'express';

import { asyncHandler } from '@lib/http/asyncHandler.js';
import { ResponseUtil } from '@lib/response.js';

const router: IRouter = Router();

// Module 0 — Election Simulator. Stub list of races so the FE has a target.
// Real implementation calls the data-layer service for race/PU metadata, then
// runs the model. See docs/product/mvp.md.

router.get(
  '/races',
  asyncHandler(async (_req, res) => {
    return ResponseUtil.ok(res, {
      items: [
        { id: 'race_demo_lagos_pres_2027', office: 'president', state: 'lagos', cycle: 2027 },
        { id: 'race_demo_anambra_gov_2025', office: 'governor', state: 'anambra', cycle: 2025 },
      ],
    });
  }),
);

router.post(
  '/run',
  asyncHandler(async (_req, res) => {
    return ResponseUtil.accepted(res, {
      scenarioId: 'scn_stub',
      status: 'queued',
    });
  }),
);

export default router;
