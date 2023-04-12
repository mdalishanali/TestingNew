// NPM Deps
import * as express from 'express';
import { Middleware } from '../../../services/middleware';

// Internal Deps
import { InviteUserRoutes } from './routes';

const middleware = new Middleware();
export class InviteUserRouter {
  router: express.Router;
  constructor() {
    this.router = express.Router();
    this.router.use(middleware.requireSuperAdmin);
    this.router.post('/invite', InviteUserRoutes.inviteUser);
    this.router.post('/resend-invite', InviteUserRoutes.resendInvites);
    this.router.get('/invited-users', InviteUserRoutes.getInvitedUser);
    this.router.get('/cancelInvite/:id', InviteUserRoutes.cancelInvite);
    // this.router.get('/invited-user', InviteUserRoutes.getInvitedUser);
    // this.router.post('/remove-user', InviteUserRoutes.removeUser);
  }
}
