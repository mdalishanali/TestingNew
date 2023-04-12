// NPM Deps
import * as express from 'express';
import { Middleware } from '../../services/middleware';

// Internal Deps
import { InviteUserRoutes } from './routes';

const middleware = new Middleware();
export class InviteUserRouter {
  router: express.Router;
  constructor() {
    this.router = express.Router();
    this.router.use(middleware.requireAdmin);
    this.router.post('/invite', InviteUserRoutes.inviteUser);
    this.router.post('/resend-invite', InviteUserRoutes.resendInvites);
    this.router.get('/invited-users', InviteUserRoutes.getInvitedUser);
    this.router.get('/cancelInvite/:id', InviteUserRoutes.cancelInvite);
  }
}

export class AcceptInviteRouter {
  router: express.Router;
  constructor() {
    this.router = express.Router();
    this.router.get('/invite', InviteUserRoutes.checkInvitation);
    this.router.get('/accept-invite/:inviteToken', InviteUserRoutes.acceptInvite);
  }
}
