// NPM Dependencies
import * as status from 'http-status';
import * as express from 'express';

// Internal Dependencies
import { FcmTokensHelpers } from './helpers';
import { AuthenticatedRequest } from 'interfaces/authenticated-request';

export class FcmTokensRoutes {
    public static get = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
        try {
            const query = req.query;
            const user = req.user._id;
            const data = await FcmTokensHelpers.findAll(query);
            res.locals.code = status.OK;
            res.locals.res_obj = { data };
            return next();
        } catch (error) {
            next(error);
        }
    }
    public static getOne = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
      try {
        const id = req.params.id;
        const data = await FcmTokensHelpers.findOne(id);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
    public static create = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
        try {
          const document = req.body.document;
          document.userId = req.user._id;
          const id = req.user._id;
          const doc = await FcmTokensHelpers.findtoken(id, document.token);
          if (!doc[0]) {
            const data = await FcmTokensHelpers.create(document);
            res.locals.res_obj = { data };
          } else {
            res.locals.res_obj = { message: 'token already exists' };
          }
          res.locals.code = status.OK;
          return next();
        } catch (error) {
          next(error);
        }
      }
      public static update = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
        try {
          const id = req.params.id;
          const update = req.body.update;
          const doc = await FcmTokensHelpers.findOne(id);
          const data = await FcmTokensHelpers.findAndUpdate({ id, update });
          res.locals.code = status.OK;
          res.locals.res_obj = { data };
          return next();
        } catch (error) {
          next(error);
        }
      }
    public static getUserTokens = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
        try {
          const userId = req.user._id;
          const data = await FcmTokensHelpers.getUserTokens(userId);
          res.locals.code = status.OK;
          res.locals.res_obj = { data };
          return next();
        }
        catch (error) {
          next(error);
        }
    }

    public static deleteToken = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
      try {
        const token = req.params.token;
        const userId = req.user._id;
        const data = await FcmTokensHelpers.deleteToken(token, userId);
        res.locals.code = status.OK;
        res.locals.res_obj = { data };
        return next();
      }
      catch (error) {
        next(error);
      }
  }
}
