import * as status from 'http-status';
import * as express from 'express';

import { RefundHelpers } from './helpers';
import { AuthenticatedRequest } from '../../interfaces/authenticated-request';

export class RefundRoutes {
    public static  getAllPayments = async (
        req: AuthenticatedRequest,
        res: express.Response,
        next: express.NextFunction
    ) => {
        try {
            const query = req.query;
            const userId = req.user._id;
            const data = await RefundHelpers.getAllRefunds(query, userId);
            res.locals.code = status.OK;
            res.locals.res_obj = { data };
            return next();
        } catch (error) {
            next(error);
        }
    }
}
