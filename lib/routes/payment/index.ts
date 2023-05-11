import * as express from 'express';
import { PaymentRoutes } from './routes';

export class PaymentRouter {
    router: express.Router;
    constructor() {
        this.router = express.Router();
        this.router.get('/', PaymentRoutes.getPayments);
        this.router.get('/getPaymentDetails/:id', PaymentRoutes.getPaymentsById);
        this.router.get('/getUserCardDetails/:userId', PaymentRoutes.getUserCardDetails);
        this.router.post('/change/savedcard', PaymentRoutes.changeSavedCard);
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

        this.router.post('/create/payment/intent', PaymentRoutes.createPaymentIntent);
        this.router.post('/onboard/user/stripe', PaymentRoutes.onboardUserToStripeConnect);
        this.router.post('/transfer/split/payment', PaymentRoutes.splitTransferPayment);
        this.router.post('/transfer/money/connected/account', PaymentRoutes.transferMoneyToConnectedAccount);
        this.router.post('/refund/money/user', PaymentRoutes.refundMoenytoUser);
        this.router.post('/refund/money/connect/:chargeId', PaymentRoutes.refundMoneytoUserStripeConnect);
        this.router.post('/transaction/connected/account', PaymentRoutes.getTransactionListConnectedAccount);
        this.router.post('/total/earned/connected/account', PaymentRoutes.getTotalEarnedConnectedAccount);
        
        
        
        
        this.router.post('/seller/charges/:accountId', PaymentRoutes.getSellerChargeList);
        this.router.post('/connect/all/seller', PaymentRoutes.getAllSellers);
        this.router.post('/customers/all/list', PaymentRoutes.getCustomersList);
        this.router.post('/charge/all/list', PaymentRoutes.getChargeList);

        // new one
        this.router.post('/create/split/intent', PaymentRoutes.createSplitPaymentIntent);
        this.router.post('/seller/charge/list', PaymentRoutes.getSellerCharge);

    }
}

