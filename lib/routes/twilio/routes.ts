// NPM Dependencies
import * as express from 'express';
import * as StandardError from 'standard-error';
import * as status from 'http-status';
import { MessageService } from '../../services/message';

export class TwilioRoutes {

  public static send = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const { number: num, message } = req.body;
        const messageservice = new MessageService();
        if ( !messageservice.validE164(num) ) {
          throw new StandardError('number must be E164 format!');
        }
        messageservice.sendMessages(num, message)
                      .then((result) => {
                        res.locals.code = status.OK;
                        res.locals.res_obj = {};
                        return next();
                      })
                      .catch((err) => {
                        res.locals.code = status.OK;
                        res.locals.res_obj = err;
                        return next();
                      });
      } catch (error) {
      next(error);
    }
  }
}
