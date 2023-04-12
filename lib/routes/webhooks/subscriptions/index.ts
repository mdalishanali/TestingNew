import * as express from 'express';
import { SubscriptionsRoutes } from './routes';
export class SubscriptionsRouter {
    router: express.Router;
    constructor() {
        this.router = express.Router();
        this.router.post('/', SubscriptionsRoutes.processStripeSubscriptionWebhook);
    }
}

