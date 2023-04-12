import * as express from 'express';
import Stripe from 'stripe';
import { config } from './../../../config';
import { User } from '../../../db/index';
import { stripeService } from '../../../services/stripe-service';
import { EmailService } from '../../../services/email';
import { UsersHelpers } from 'lib/routes/payment/helpers/user.helper';
export class SubscriptionsRoutes {
     stripe;
    constructor(
    ) {
        this.stripe = new Stripe(config.STRIPE_SECRET_KEY, {
            apiVersion: "2020-08-27",
          } );
    } 

    public static async processStripeSubscriptionWebhook(req: express.Request, res: express.Response, next) {
        try {
                // Retrieve the event by verifying the signature using the raw body and secret.
                let event;
                const userHelpers = UsersHelpers;
                try {
                    event = await stripeService.constructEvent(req.body, req.headers['stripe-signature']);
 
                } catch (err) {
                    console.log(err);
                    console.log(`⚠️  Webhook signature verification failed.`);
                    console.log( `⚠️  Check the env file and enter the correct webhook secret.`);
                    return res.sendStatus(400);
                }
                // Extract the object from the event.
                const dataObject = event.data.object;
                let userEmail, client, email;
                switch (event.type) {
                case 'invoice.payment_succeeded':
                     userEmail = dataObject.customer_email;
                     client = await User.findOne({email: userEmail}).lean();
                     await stripeService.createSubscriptionPayment({loggerInUserDetails: client, sub : {
                        customer: dataObject.customer,
                        id: dataObject.subscription,
                    }});
                     email = new EmailService();
                     UsersHelpers.renewSubscription({'id' : client._id, 'endDate' : dataObject.lines.data[0].period.end});
                     email.subscriptionRenewalSuccessEmail(client);

                    // Used to provision services after the trial has ended.
                    // The status of the invoice will show up as paid. Store the status in your
                    // database to reference when a user accesses your service to avoid hitting rate limits.
                    break;
                case 'invoice.payment_failed':
                     userEmail = dataObject.customer_email;
                     client = await User.findOne({email: userEmail}).lean();
                     email = new EmailService();
                     email.subscriptionRenewalFailedEmail(client);
                    // If the payment fails or the customer does not have a valid payment method,
                    //  an invoice.payment_failed event is sent, the subscription becomes past_due.
                    // Use this webhook to notify your user that their payment has
                    // failed and to retrieve new card details.
                    break;
                case 'customer.subscription.deleted':
                    if (event.request != null) {
                    // handle a subscription cancelled by your request
                    // from above.
                    } else {
                    // handle subscription cancelled automatically based
                    // upon your subscription settings.
                    }
                    break;
                default:
                // Unexpected event type
                }
                res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    }
}

