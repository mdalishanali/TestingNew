// NPM Deps
import * as express from 'express';
import { Middleware } from '../../services/middleware';

// Internal Deps
import { JWPlayerRoutes } from './routes';
const middleware = new Middleware();
export class JWPlayerRouter {
  router: express.Router;
  constructor() {
    this.router = express.Router();
    this.router
      .post('/create-jwuri', JWPlayerRoutes.createJwURl)
      .post('/get-videouri', JWPlayerRoutes.getJWPlayerVideoUrls);
  }
}
