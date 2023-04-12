// NPM Deps
import * as express from 'express';
import { Middleware } from '../../../services/middleware';

// Internal Deps
import { CompanyRoutes } from './routes';

const middleware = new Middleware();
export class CompanyRouter {
  router: express.Router;
  constructor() {
    this.router = express.Router();
    this.router.use(middleware.requireSuperAdmin);
    this.router.get('/', CompanyRoutes.getCompanies);
    this.router.get('/:id', CompanyRoutes.getCompanyDetails);
    this.router.put('/:id', CompanyRoutes.editCompany);
    this.router.get('/users/:id', CompanyRoutes.getCompanyUsers);
    this.router.get('/invites/:id', CompanyRoutes.getCompanyInviteDetails);
    this.router.put('/change-user-role/:id', CompanyRoutes.changeUserRole);
    this.router.post('/invite/:id', CompanyRoutes.inviteUser);
    this.router.post('/resend-invite/:id', CompanyRoutes.resendInvites);
    this.router.put('/cancelInvite/:id', CompanyRoutes.cancelInvite);
  }
}
