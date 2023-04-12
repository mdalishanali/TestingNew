import * as express from 'express';
export interface AuthenticatedRequest extends express.Request {
    user: any;
    params: any;
    body: any;
}
