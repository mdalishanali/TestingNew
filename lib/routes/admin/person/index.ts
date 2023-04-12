
    // NPM Deps
    import * as express from 'express';
    import { Middleware } from '../../../services/middleware';

    // Internal Deps
    import { PersonRoutes } from './routes';
    const middleware = new Middleware();
    export class PersonRouter {
      router: express.Router;
      constructor() {
        this.router = express.Router();
        this.router.use(middleware.requireAdmin);
        this.router
          .get('/', PersonRoutes.get)
          .post('/', PersonRoutes.create)
        this.router
          .get('/:id', PersonRoutes.getOne)
          .put('/:id', PersonRoutes.update)
          .delete('/:id', PersonRoutes.delete);
      }
    }
    