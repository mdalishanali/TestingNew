// NPM Deps
import * as express from 'express';
import { Middleware } from '../../../services/middleware';

// Internal Deps
import { PaymentRoutes } from './routes';

const middleware = new Middleware();
export class PaymentRouter {
  router: express.Router;
  constructor() {
    this.router = express.Router();
    this.router.use(middleware.requireSuperAdmin);
    this.router.get('/', PaymentRoutes.getAllPayments);
    this.router.post('/refund/create', PaymentRoutes.createRefundForCharge);
  }
}
