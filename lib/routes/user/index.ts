import * as express from 'express';
import { UserRoutes } from './routes';

export class UserRouter {
  router: express.Router;
  constructor() {
    this.router = express.Router();
    this.router.post('/send-reset-email', UserRoutes.sendResetEmail);
    this.router.get('/reset-password/:token', UserRoutes.resetPassword);
    this.router.post('/update-password', UserRoutes.updatePassword);
    this.router.get('/me', UserRoutes.me);
    this.router.put('/:id/unsubscribe', UserRoutes.unsubscribe);
    this.router.post('/changePassword', UserRoutes.changePassword);
    this.router.put('/update-profile', UserRoutes.updateProfile);
  }
}

