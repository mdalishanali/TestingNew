import * as express from 'express';
import { AwsRoutes } from './routes';

export class AwsRouter {
  router: express.Router;
  constructor() {
    this.router = express.Router();
    this.router.get('/get-aws-url', AwsRoutes.getPreSignedUrl);
  }
}
