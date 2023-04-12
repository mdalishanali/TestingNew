import * as express from 'express';

import { AdminRouter } from './admin/admin';
      import { ProductsRouter } from './products';
      import { PersonRouter } from './person';
import { AuthRouter } from './auth';
// import { PasswordRouter } from './password';

import { PaymentRouter } from './payment';
import { TwilioRouter } from './twilio';
import { Middleware } from '../services/middleware';
import { EmailRouter } from './email';
import { ChatRouter } from './chat';
import { FileRouter } from './file';
import { ReviewRouter } from './review';
import { UserRouter } from './user';
import { AwsRouter } from './aws';
import { JWPlayerRouter } from './jwPlayer';
import { RefundRouter } from './refunds';
import { FcmTokensRouter } from './fcmTokens';
import { InviteUserRouter, AcceptInviteRouter } from './inviteUser';
import { ApiLogServices } from '../services/api.log';
import { ErrorLogServices } from '../services/error.log';
import { AutoCompleteRouter } from './autoComplete';

const middleware = new Middleware();

export const api = express.Router();
api.use(middleware.jwtDecoder);

api.use('/admin', new AdminRouter().router);
      api.use('/products', new ProductsRouter().router);
      api.use('/person', new PersonRouter().router);

// api.use('/password', new PasswordRouter().router);

api.use('/auth', new AuthRouter().router);
api.use('/payment', new PaymentRouter().router);
api.use('/twilio', new TwilioRouter().router);
api.use('/email', new EmailRouter().router);
api.use('/chat', new ChatRouter().router);
api.use('/file', new FileRouter().router);
api.use('/review', new ReviewRouter().router);
api.use('/user', new UserRouter().router);
api.use('/aws', new AwsRouter().router);
api.use('/jw-player', new JWPlayerRouter().router);
api.use('/inviteUser', new InviteUserRouter().router);
api.use('/accept-invite', new AcceptInviteRouter().router);
api.use('/refund', new RefundRouter().router);
api.use('/fcm-token', new FcmTokensRouter().router);
api.use('/autoComplete', new AutoCompleteRouter().router);

api.use(ApiLogServices.apiLog);
api.use(ErrorLogServices.errorLog);
