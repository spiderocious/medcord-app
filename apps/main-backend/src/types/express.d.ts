// @types/express v5 ParamsDictionary has string | string[] values.
// Re-declare to use ParamsFlatDictionary (string only) as the default
// for our route handlers which always receive plain string params.
import type { ParamsFlatDictionary } from 'express-serve-static-core';

declare global {
  namespace Express {
    interface Request {
      params: ParamsFlatDictionary;
    }
  }
}
