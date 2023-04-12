// NPM Deps
import * as express from 'express';
import { Middleware } from '../../../services/middleware';

// Internal Deps
import { AdminUsersRoutes } from './routes';
const middleware = new Middleware();
export class AdminUsersRouter {
  router: express.Router;
  constructor() {
    this.router = express.Router();
    this.router
      .get('/', AdminUsersRoutes.get)
      .get('/:id' , AdminUsersRoutes.getOne);
  }
}
