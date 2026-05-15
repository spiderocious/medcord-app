import { z } from 'zod';
import type { Express } from 'express';

import { asyncHandler } from '@lib/http/asyncHandler.js';
import { ResponseUtil } from '@lib/response.js';
import { authenticate } from '@middlewares/auth.middleware.js';
import { hospitalScope } from '@middlewares/hospital-scope.middleware.js';
import { PatientModel } from '@features/patients/patient.model.js';
import { HospitalPatientModel } from '@features/patients/patient.model.js';
import { AssetModel } from '@features/assets/asset.model.js';
import { LabOrderModel } from '@features/labs/lab.model.js';

const SearchQuery = z.object({
  q: z.string().min(1).max(200).trim(),
  types: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(',') : ['patients', 'assets', 'labs'])),
  limit: z.coerce.number().int().min(1).max(20).default(5),
});

export const register = (app: Express): void => {
  app.get(
    '/api/v1/hospitals/:hospitalId/search',
    authenticate,
    hospitalScope,
    asyncHandler(async (req, res) => {
      const query = SearchQuery.parse(req.query);
      const { q, types, limit } = query;
      const hospitalId = req.params['hospitalId'] as string;
      const results: Record<string, unknown[]> = {};

      if (types.includes('patients')) {
        const patientIds = await HospitalPatientModel.find({ hospitalId, isActive: true })
          .select('patientId')
          .lean();
        const ids = patientIds.map((p) => p['patientId']);
        const patients = await PatientModel.find({
          id: { $in: ids },
          $or: [
            { 'demographics.firstName': new RegExp(q, 'i') },
            { 'demographics.lastName': new RegExp(q, 'i') },
            { patientCode: new RegExp(q, 'i') },
          ],
        })
          .limit(limit)
          .lean();
        results['patients'] = patients;
      }

      if (types.includes('assets')) {
        const assets = await AssetModel.find({
          hospitalId,
          $or: [
            { name: new RegExp(q, 'i') },
            { assetTag: new RegExp(q, 'i') },
            { serialNumber: new RegExp(q, 'i') },
          ],
        })
          .limit(limit)
          .lean();
        results['assets'] = assets;
      }

      if (types.includes('labs')) {
        const labs = await LabOrderModel.find({
          hospitalId,
          $or: [
            { testName: new RegExp(q, 'i') },
            { testCode: new RegExp(q, 'i') },
          ],
        })
          .limit(limit)
          .lean();
        results['labs'] = labs;
      }

      return ResponseUtil.ok(res, { results });
    }),
  );
};
