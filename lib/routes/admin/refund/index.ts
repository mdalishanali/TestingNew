// NPM Deps
import * as express from 'express';
import { Middleware } from '../../../services/middleware';

// Internal Deps
import { RefundsRoutes } from './routes';
const middleware = new Middleware();
export class RefundsRouter {
  router: express.Router;
  constructor() {
    this.router = express.Router();
    this.router.use(middleware.requireSuperAdmin);
    this.router.get('/', RefundsRoutes.get).post('/', RefundsRoutes.create);
    this.router
      .get('/:id', RefundsRoutes.getOne)
      .put('/:id', RefundsRoutes.update)
      .delete('/:id', RefundsRoutes.delete);
  }
}
