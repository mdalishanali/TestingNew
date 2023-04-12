import * as express from 'express';
import { FileRoutes } from './routes';

export class FileRouter {
    router: express.Router;
    constructor() {
        this.router = express.Router();
        this.router.post('/upload', FileRoutes.upload);
    }
}

