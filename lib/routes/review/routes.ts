// NPM Dependencies
import * as express from 'express';
import * as StandardError from 'standard-error';
import * as status from 'http-status';
import { Review } from '../../db/index';

export class ReviewRoutes {
  public static async create(req: express.Request, res: express.Response, next) {
    try {
      const { review } = req.body;
      const data = await Review.create(review);
      res.locals.code = status.OK;
      res.locals.res_obj = { data };
      return next();
    } catch (error) {
      next(error);
    }
  }
}
