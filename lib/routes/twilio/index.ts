import * as express from 'express';
import { TwilioRoutes } from './routes';

export class TwilioRouter {
  router: express.Router;
  constructor() {
    this.router = express.Router();
    this.router.post('/send', TwilioRoutes.send);
  }
}
