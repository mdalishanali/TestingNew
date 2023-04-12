// NPM Dependencies
import * as express from 'express';
import * as status from 'http-status';
// Internal Dependencies
import { EmailService } from '../../services/email';


export class EmailRoutes {
  public static contactForm = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const { name, email, message } = req.body;
      const emailService = new EmailService();
      await emailService.contactFormSubmission({ name, email, message });
      res.locals.code = status.OK;
      res.locals.res_obj = { data: 'Mail sended successfully' };
      return next();
    } catch (error) {
      next(error);
    }
  }
}
