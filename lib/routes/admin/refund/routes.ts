// NPM Dependencies
import * as status from 'http-status';
import * as express from 'express';

// Internal Dependencies
import { RefundHelpers } from './helpers';
import { AuthenticatedRequest } from 'interfaces/authenticated-request';

export class RefundsRoutes {
  public static get = async (
    req: AuthenticatedRequest,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const query = req.query;
      const data = await RefundHelpers.findAll(query);
      res.locals.code = status.OK;
      res.locals.res_obj = { data };
      return next();
    } catch (error) {
      next(error);
    }
  }

  public static getOne = async (
    req: AuthenticatedRequest,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const id = req.params.id;
      const data = await RefundHelpers.findOne(id);
      res.locals.code = status.OK;
      res.locals.res_obj = { data };
      return next();
    } catch (error) {
      next(error);
    }
  }

  public static update = async (
    req: AuthenticatedRequest,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const id = req.params.id;
      const update = req.body.update;
      const data = await RefundHelpers.findAndUpdate({ id, update });
      res.locals.code = status.OK;
      res.locals.res_obj = { data };
      return next();
    } catch (error) {
      next(error);
    }
  }

  public static create = async (
    req: AuthenticatedRequest,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const document = req.body.document;
      const data = await RefundHelpers.create(document);
      res.locals.code = status.OK;
      res.locals.res_obj = { data };
      return next();
    } catch (error) {
      next(error);
    }
  }

  public static delete = async (
    req: AuthenticatedRequest,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const id = req.params.id;
      RefundHelpers.softDelete(id);
      res.locals.code = status.OK;
      res.locals.res_obj = { };
      return next();
    } catch (error) {
      next(error);
    }
  }
}
