import * as express from 'express';
import * as status from 'http-status';
      import { ProductsRouter } from './products';
      import { PersonRouter } from './person';
import { AdminUsersRouter } from './users';
import { InviteUserRouter } from './inviteUser';
import { PaymentRouter } from './payments';
import { RefundsRouter } from './refund';
import { CompanyRouter } from './company';

export class AdminRouter {
  router: express.Router;
  constructor() {
    this.router = express.Router();
      this.router.use('/products', new ProductsRouter().router);
      this.router.use('/person', new PersonRouter().router);
    this.router.use('/user', new AdminUsersRouter().router);
    this.router.use('/inviteUser', new InviteUserRouter().router);
    this.router.use('/payments', new PaymentRouter().router);
    this.router.use('/refunds', new RefundsRouter().router);
    this.router.use('/company', new CompanyRouter().router);
  }
}
