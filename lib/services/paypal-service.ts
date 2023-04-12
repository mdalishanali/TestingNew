import { User, Payment } from './../db/index';

class PayPalService {

    public savePayPalPayment = async (loggerInUserDetails, payPalData) => {
        const payment = await Payment.create({
            'amount': payPalData.transactions[0].amount.total,
            'status': payPalData.state,
            'stripeCustomerId': 0,
            'chargeId': 0,
            'paypalPayerId': payPalData.payer.payer_info.payer_id,
            'user': loggerInUserDetails._id || null,
            'transactionId': payPalData.id,
            'email': payPalData.payer.payer_info.email,
            'currency': payPalData.transactions[0].amount.currency,
            'gateWay': 'paypal'
        });
        return payment;
    }
}


export const payPalService = new PayPalService();
