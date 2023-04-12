import * as express from 'express';
import { PaymentRoutes } from './routes';

export class PaymentRouter {
    router: express.Router;
    constructor() {
        this.router = express.Router();
        this.router.get('/', PaymentRoutes.getPayments);
        this.router.get('/getPaymentDetails/:id' , PaymentRoutes.getPaymentsById);
        this.router.get('/getUserCardDetails/:userId' , PaymentRoutes.getUserCardDetails);
        this.router.post('/change/savedcard' , PaymentRoutes.changeSavedCard);
        this.router.post('/charge/create', PaymentRoutes.createCharge);
        this.router.post('/charge/savedCard', PaymentRoutes.chargeSavedCard);
        this.router.get('/getSavedCard', PaymentRoutes.retrieveSavedCard);
        this.router.post('/charge/guestCard', PaymentRoutes.chargeGuestCard);
        this.router.post('/savePayPalPayment', PaymentRoutes.savePayPalPayment);
        this.router.post('/saveCard', PaymentRoutes.saveCard);
        this.router.post('/deleteCard', PaymentRoutes.deleteCard);
        this.router.put('/updateCard', PaymentRoutes.updateCard);
        this.router.post('/subscription/create', PaymentRoutes.createSubscriptionCharge);
        this.router.put('/subscription/cancelRenewal', PaymentRoutes.cancelRenewal);
    }
}

