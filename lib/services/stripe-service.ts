import { config } from './../config';
import { User, Payment } from './../db/index';
import Stripe from 'stripe';
import { APP_CONST } from '../../shared/constants/constants';

class StripeService {
    stripe;

    constructor() {
        this.stripe = new Stripe(config.STRIPE_SECRET_KEY, {
            apiVersion: "2020-08-27",
        });
    }

    public createCustomer = async ({ loggerInUserDetails, chargeData }) => {
        const customer = await this.stripe.customers.create({
            metadata: {
                Id: loggerInUserDetails.id,
                UserName: `${loggerInUserDetails.fullName}`,
            },
            source: chargeData.token.id,
            email: loggerInUserDetails.email
        });
        return customer;
    }

    public createChargeWithSavedCard = async ({ loggerInUserDetails, chargeData }) => {
        const charge = await this.stripe.charges.create({
            amount: chargeData.amount,
            currency: chargeData.currency,
            customer: loggerInUserDetails.stripeCustomerId,
            source: chargeData.source
        });
        return charge;
    }

    public createChargeWithOutSavedCard = async (chargeData) => {
        const charge = await this.stripe.charges.create({
            amount: chargeData.amount,
            currency: chargeData.currency,
            source: chargeData.token.id
        });
        return charge;
    }

    public createChargeWithSource = async ({ loggerInUserDetails, chargeData, source }) => {
        const charge = await this.stripe.charges.create({
            amount: chargeData.amount,
            currency: chargeData.currency,
            customer: loggerInUserDetails.stripeCustomerId,
            source: source.id
        });
        return charge;
    }

    public createSource = async ({ loggerInUserDetails, chargeData }) => {
        const customer = await this.stripe.customers.createSource(loggerInUserDetails.stripeCustomerId, {
            source: chargeData.token.id
        });
        return customer;
    }

    public listAllCards = async (loggerInUserDetails) => {
        const cardList = await this.stripe.customers.listSources(loggerInUserDetails.stripeCustomerId);
        return cardList;
    }


    
    public updateCard = async ({ loggerInUserDetails, chargeData }) => {
        const card = await this.stripe.customers.updateSource(
            loggerInUserDetails.stripeCustomerId,
            chargeData.source,
            chargeData.newDetails
        );

        return card
    }

    public deleteCard = async ({ loggerInUserDetails, chargeData }) => {
        const confirmation = await this.stripe.customers.deleteSource(
            loggerInUserDetails.stripeCustomerId,
            chargeData.source);
        return confirmation;
    }

    public createPayment = async ({ loggerInUserDetails, charge }) => {
        const payment = await Payment.create({
            'amount': charge.amount,
            'status': charge.status,
            'stripeCustomerId': loggerInUserDetails.stripeCustomerId || 0,
            'chargeId': charge.id,
            'user': loggerInUserDetails._id || null,
            'cardToken': charge.source.id,
            'transactionId': charge.balance_transaction,
            'email': loggerInUserDetails.email,
            'currency': charge.currency,
            'failureCode': charge.failure_code, // When status is success, it will be NULL.
            'failureMessage': charge.failure_message, // When status is success, it will be NULL.
            'gateWay': 'stride'
        });
        return payment;
    }

    public createSubscription = async (customer) => {
        return await this.stripe.subscriptions.create({
            customer: customer.stripeCustomerId,
            items: [
                { price: config.STRIPE_PRICEID },
            ],
            metadata: {
                name: customer.fullName,
                email: customer.email
            }
        });
    }

    public constructEvent = async (body, stripeSignature) => {
        return this.stripe.webhooks.constructEvent(
            body,
            stripeSignature,
            config.STRIPE_WEBHOOK_SECRET
        );
    }

    public getCardDetails = async (customerId, cardToken) => {
        return this.stripe.customers.retrieveSource(customerId, cardToken)
    }

    public cancelSubscription = async subscriptionId => {
        return await this.stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true
        });
    }

    public addNewCard = async ({customer_id , card_token})=>{
        return await this.stripe.customers.createSource(
             customer_id ,
            {source: card_token}
          );
    }    

    public updateDefaultCard = async ({customer_id , card_id})=>{
       return await this.stripe.customers.update(
            customer_id,
            {default_source : card_id}
          );
    }

    public createSubscriptionPayment = async ({ loggerInUserDetails, sub }, cardToken?) => {
        const payment = await Payment.create({
            type: 'subscription',
            amount: APP_CONST.PRICES.SUB_AMOUNT,
            stripeCustomerId: sub.customer,
            subscriptionId: sub.id,
            user: loggerInUserDetails._id || null,
            email: loggerInUserDetails.email,
            currency: 'gbp',
            cardToken: cardToken ? cardToken : null,
            gateWay: 'stripe',
        });
        return payment;
    }

    public createRefundForCharge = async(refundData: { amount: number, charge: string, reason?: string })=>{
        let penny = 100
        let numberAfterDecimal = 2
        const formattedAmount = parseInt((refundData.amount * penny).toFixed(numberAfterDecimal));
        const refund = await this.stripe.refunds.create({
          amount: formattedAmount,
          charge: refundData.charge,
          reason: refundData.reason
        });
        return refund
    }
}
export const stripeService = new StripeService();
