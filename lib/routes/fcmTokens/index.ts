// NPM Deps
import * as express from 'express';

// Internal Deps
import { FcmTokensRoutes } from './routes';
import { Middleware } from '../../services/middleware';

const middleware = new Middleware();
export class FcmTokensRouter {
    router: express.Router;
    constructor() {
        this.router = express.Router();
        this.router.use(middleware.requireLogin);
        this.router
            .get('/', FcmTokensRoutes.get)
            .get('/:id', FcmTokensRoutes.getOne)
            .post('/', FcmTokensRoutes.create)
            .put('/:id', FcmTokensRoutes.update)
            .get('/userTokens', FcmTokensRoutes.getUserTokens)
            .delete('/:token', FcmTokensRoutes.deleteToken);
        }
}
