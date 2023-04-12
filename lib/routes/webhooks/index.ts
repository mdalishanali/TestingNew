import * as express from 'express';
import { SubscriptionsRouter} from './subscriptions';

export class WebhooksRouter {
    router: express.Router;
    constructor() {
        this.router = express.Router();
        this.router.use('/subscriptions', new SubscriptionsRouter().router);
    }
}

