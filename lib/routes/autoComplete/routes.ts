
// NPM Dependencies
import * as status from 'http-status';
import * as express from 'express';

// Internal Dependencies
import {  AutoCompleteHelpers } from './helpers';
import { AuthenticatedRequest } from 'interfaces/authenticated-request';

export class AutoCompleteRoutes {

        public static get = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
                try {
                        const query = req.query;
                        const user = req.user;
                        const data = await AutoCompleteHelpers.findAll(query, user);
                        res.locals.code = status.OK;
                        res.locals.res_obj = { data, }
                        return next();
                } catch (error) {
                        next(error);
                }
        }

}
