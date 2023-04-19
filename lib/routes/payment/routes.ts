import * as express from 'express';
import * as status from 'http-status';
import { User, Payment } from './../../db/index';
import { stripeService } from './../../services/stripe-service';
import { PaymentErrorHandlerService } from './payment-error-handler';
import { payPalService } from './../../services/paypal-service';
import { EmailService } from './../../services/email';
import { UsersHelpers } from './helpers/user.helper';
import { AuthenticatedRequest } from '../../interfaces/authenticated-request';
import { config } from '../../config';

const stripe = require('stripe')(config.STRIPE_SECRET_KEY);


export class PaymentRoutes {
  public static getPayments = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    const loggerInUserDetails = req.user;
    const payments = await Payment.find({ user: loggerInUserDetails._id });
    const paymentClone = JSON.parse(JSON.stringify(payments));
    paymentClone.forEach(async (ele, i) => {
      if (paymentClone[i].stripeCustomerId !== '0') {
        const data = await stripeService.getCardDetails(
          paymentClone[i].stripeCustomerId,
          paymentClone[i].cardToken
        );
        paymentClone[i]['cardDetails'] = data;
      }
    });
    res.locals.code = status.OK;
    res.locals.res_obj = paymentClone;
    return next();
  }

  public static getPaymentsById = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    const { id } = req.params;
    const userDetails = await User.findById(id);
    const payments = await Payment.find({ user: userDetails._id });
    const paymentClone = JSON.parse(JSON.stringify(payments));
    paymentClone.forEach(async (ele, i) => {
      if (paymentClone[i].stripeCustomerId !== '0') {
        const data = await stripeService.getCardDetails(
          paymentClone[i].stripeCustomerId,
          paymentClone[i].cardToken
        );
        paymentClone[i]['cardDetails'] = data;
      }
    });
    res.locals.code = status.OK;
    res.locals.res_obj = paymentClone;
    return next();
  }

  public static getUserCardDetails = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    const { defaultCardToken, stripeCustomerId } = await User.findById(
      req.params.userId
    );
    if (defaultCardToken && stripeCustomerId) {
      const cardDetails = await stripeService.getCardDetails(
        stripeCustomerId,
        defaultCardToken
      );
      res.locals.code = status.OK;
      res.locals.res_obj = cardDetails;
      return next();
    } else {
      res.locals.code = status.OK;
      res.locals.res_obj = { message: 'Not a Subscribed User' };
      return next();
    }
  }

  public static createCharge = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    const loggerInUserDetails = req.user;
    const chargeData = req.body.chargeData;
    let customer;
    let charge;
    try {
      if (!loggerInUserDetails.stripeCustomerId && chargeData.saveThisCard) {
        customer = await stripeService.createCustomer({ loggerInUserDetails, chargeData });
        const user = await User.findByIdAndUpdate(
          loggerInUserDetails._id,
          {
            $push: { cardTokens: chargeData.token.card.id },
            stripeCustomerId: customer.id,
            defaultCardToken: customer.default_source,
          }
        );
        loggerInUserDetails.stripeCustomerId = customer.id;
        charge = await stripeService.createChargeWithSavedCard({ loggerInUserDetails, chargeData });

      } else if (loggerInUserDetails.stripeCustomerId && chargeData.saveThisCard) {
        const source = await stripeService.createSource({ loggerInUserDetails, chargeData });
        const user = await User.findByIdAndUpdate(
          loggerInUserDetails._id,
          { $push: { cardTokens: source.id } },
          { new: true }
        );
        charge = await stripeService.createChargeWithSource({ loggerInUserDetails, chargeData, source });

      } else {
        charge = await stripeService.createChargeWithOutSavedCard(chargeData);
      }

      const payment = await stripeService.createPayment({ loggerInUserDetails, charge });
      res.locals.code = status.OK;
      res.locals.res_obj = payment;
      return next();
    } catch (error) {
      PaymentErrorHandlerService.PaymentErrorHandleError(error, next);
    }
  }

  public static changeSavedCard = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    try {
      const { customer_id, card_token, _id } = req.body;
      const newCard = await stripeService.addNewCard({
        customer_id,
        card_token,
      });
      if (newCard) {
        const customer = await stripeService.updateDefaultCard({
          customer_id,
          card_id: newCard.id,
        });
        if (customer) {
          const updatedUser = await User.update(
            { _id: _id },
            {
              $addToSet: { cardTokens: newCard.id },
              defaultCardToken: newCard.id,
            }
          );
          res.locals.code = status.OK;
          res.locals.res_obj = updatedUser;
          return next();
        }
      }
    } catch (error) {
      PaymentErrorHandlerService.PaymentErrorHandleError(error, next);
    }
  }

  public static retrieveSavedCard = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    const loggerInUserDetails = req.user;
    try {
      if (loggerInUserDetails && loggerInUserDetails.stripeCustomerId) {
        const cardList = await stripeService.listAllCards(loggerInUserDetails);
        if (cardList && cardList.data && cardList.data.length > 0) {
          res.locals.code = status.OK;
          res.locals.res_obj = cardList.data;
        } else {
          res.locals.code = status.NO_CONTENT;
          res.locals.res_obj = {};
        }
      } else {
        res.locals.code = status.NO_CONTENT;
        res.locals.res_obj = {};
      }
      return next();
    } catch (error) {
      PaymentErrorHandlerService.PaymentErrorHandleError(error, next);
    }
  }

  public static updateCard = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    const loggerInUserDetails = req.user;
    const { chargeData } = req.body;
    try {
      const confirmation = await stripeService.updateCard({
        loggerInUserDetails,
        chargeData,
      });
      if (Boolean(confirmation)) {
        const updatedUser = await User.findById(loggerInUserDetails._id);
        res.locals.code = status.OK;
        res.locals.res_obj = updatedUser;
        return next();
      }
    } catch (error) {
      PaymentErrorHandlerService.PaymentErrorHandleError(error, next);
    }
  }

  public static chargeSavedCard = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    try {
      const loggerInUserDetails = req.user;
      const chargeData = req.body.chargeData;
      const charge = await stripeService.createChargeWithSavedCard({
        loggerInUserDetails,
        chargeData,
      });
      const payment = await stripeService.createPayment({
        loggerInUserDetails,
        charge,
      });
      res.locals.code = status.OK;
      res.locals.res_obj = payment;
      return next();
    } catch (error) {
      PaymentErrorHandlerService.PaymentErrorHandleError(error, next);
    }
  }

  public static chargeGuestCard = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    try {
      const chargeData = req.body.chargeData;
      const charge = await stripeService.createChargeWithOutSavedCard(
        chargeData
      );
      const loggerInUserDetails = { email: chargeData.email };
      const payment = await stripeService.createPayment({
        loggerInUserDetails,
        charge,
      });
      res.locals.code = status.OK;
      res.locals.res_obj = payment;
      return next();
    } catch (error) {
      PaymentErrorHandlerService.PaymentErrorHandleError(error, next);
    }
  }

  public static savePayPalPayment = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    const loggerInUserDetails = req.user;
    const payPalData = req.body.paypalResponse;
    const payment = await payPalService.savePayPalPayment(
      loggerInUserDetails,
      payPalData
    );
    res.locals.code = status.OK;
    res.locals.res_obj = payment;
    return next();
  }

  public static saveCard = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    const loggerInUserDetails = req.user;
    const { chargeData } = req.body;
    try {
      if (!loggerInUserDetails.stripeCustomerId) {
        const customer = await stripeService.createCustomer({
          loggerInUserDetails,
          chargeData,
        });
        const user = await User.findByIdAndUpdate(
          loggerInUserDetails._id,
          {
            $push: { cardTokens: chargeData.token.card.id },
            stripeCustomerId: customer.id,
            defaultCardToken: customer.default_source,
          },
          { new: true }
        );
        res.locals.res_obj = user;
      } else {
        const source = await stripeService.createSource({
          loggerInUserDetails,
          chargeData,
        });
        const user = await User.findByIdAndUpdate(
          loggerInUserDetails._id,
          { $push: { cardTokens: source.id } },
          { new: true }
        );
        res.locals.res_obj = user;
      }
      res.locals.code = status.OK;
      return next();
    } catch (error) {
      PaymentErrorHandlerService.PaymentErrorHandleError(error, next);
    }
  }

  public static deleteCard = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    const loggerInUserDetails = req.user;
    const email = req.user.email;
    const { chargeData } = req.body;
    try {
      const confirmation = await stripeService.deleteCard({
        loggerInUserDetails,
        chargeData,
      });
      if (confirmation.deleted) {
        let updatedUser;
        const user = await User.findByIdAndUpdate(
          loggerInUserDetails._id,
          { $pull: { cardTokens: chargeData.source } },
          { new: true }
        );
        let defaultCardToken = '';
        if (user.cardTokens && user.cardTokens.length > 0) {
          defaultCardToken = user.cardTokens[0];
        }
        updatedUser = await User.findByIdAndUpdate(
          loggerInUserDetails._id,
          { defaultCardToken },
          { new: true }
        );
        res.locals.code = status.OK;
        res.locals.res_obj = updatedUser;
        return next();
      }
    } catch (error) {
      PaymentErrorHandlerService.PaymentErrorHandleError(error, next);
    }
  }

  public static createSubscriptionCharge = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    try {
      const userDetails = req.user;
      const chargeData = req.body.chargeData;
      const email = new EmailService();
      let customer;
      if (!userDetails.stripeCustomerId) {
        try {
          customer = await stripeService.createCustomer({
            loggerInUserDetails: userDetails,
            chargeData,
          });
          userDetails.stripeCustomerId = customer.id;
          const sub = await stripeService.createSubscription(userDetails);
          await stripeService.createSubscriptionPayment(
            { loggerInUserDetails: userDetails, sub },
            customer.default_source
          );
          await User.findByIdAndUpdate(
            userDetails._id,
            {
              $push: { cardTokens: chargeData.token.card.id },
              stripeCustomerId: customer.id,
              defaultCardToken: customer.default_source,
              subscriptionActiveUntil: sub.current_period_end,
              subscriptionId: sub.id,
            },
            { new: true }
          );
          await email.newSubscriptionEmail(userDetails);
          res.locals.code = status.OK;
          res.locals.res_obj = sub;
          return next();
        } catch (error) {
          PaymentErrorHandlerService.PaymentErrorHandleError(error, next);
          await email.sendEmail({
            subject: 'Subscricption not made successfully',
            email: userDetails.email,
            data: `Something went wrong ${error.message}`,
          });
        }
      } else {
        try {
          const sub = await stripeService.createSubscription(userDetails);
          await stripeService.createSubscriptionPayment({
            loggerInUserDetails: req.user,
            sub,
          });
          await User.findByIdAndUpdate(
            userDetails.id,
            {
              subscriptionActiveUntil: sub.current_period_end,
              subscriptionId: sub.id,
            },
            { new: true }
          );
          await email.newSubscriptionEmail(userDetails);
          res.locals.code = status.OK;
          res.locals.res_obj = sub;
          return next();
        } catch (error) {
          PaymentErrorHandlerService.PaymentErrorHandleError(error, next);
          await email.sendEmail({
            subject: 'Subscricption not made successfully',
            email: userDetails.email,
            data: `Something went wrong ${error.message} `,
          });
        }
      }
    } catch (error) {
      PaymentErrorHandlerService.PaymentErrorHandleError(error, next);
    }
  }

  public static cancelRenewal = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    try {
      let userDetails = req.user;
      const email = new EmailService();
      if (req.body.subId) {
        // The case when admin cancels renewal
        const subsciber = await UsersHelpers.findAll({
          subscriptionId: req.body.subId,
        });
        userDetails = subsciber[0];
      }
      const subscriptionId = req.body.subId || req.user.subscriptionId;
      try {
        const sub = await stripeService.cancelSubscription(subscriptionId);
        userDetails.subscriptionCancellationRequested = true;
        await userDetails.save();
        await email.sendCancellationEmail(userDetails);
        res.locals.code = status.OK;
        res.locals.res_obj = sub;
        return next();
      } catch (error) {
        PaymentErrorHandlerService.PaymentErrorHandleError(error, next);
      }
    } catch (error) {
      PaymentErrorHandlerService.PaymentErrorHandleError(error, next);
    }
  }
  public static createRefundForCharge = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const refundData = req.body.refundData;
      const data = await stripeService.createRefundForCharge(refundData);
      res.locals.code = status.OK;
      res.locals.res_obj = { data };
      return next();
    } catch (error) {
      next(error);
    }
  }


  // 
  public static createPaymentIntent = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    try {
      const { paymentMethodType, currency, paymentMethodOptions } = req.body;

      const params: any = {
        payment_method_types: [paymentMethodType],
        amount: 10000,
        currency: currency,
        description: 'Software development services',
        shipping: {
          name: 'Jenny Rosen',
          address: {
            line1: '510 Townsend St',
            postal_code: '98140',
            city: 'San Francisco',
            state: 'CA',
            country: 'US',
          },
        },
      }

      if (paymentMethodType === 'acss_debit') {
        params.payment_method_options = {
          acss_debit: {
            mandate_options: {
              payment_schedule: 'sporadic',
              transaction_type: 'personal',
            },
          },
        }
      } else if (paymentMethodType === 'konbini') {
        params.payment_method_options = {
          konbini: {
            product_description: 'This is desc..',
            expires_after_days: 3,
          },
        }
      } else if (paymentMethodType === 'customer_balance') {
        params.payment_method_data = {
          type: 'customer_balance',
        }
        params.confirm = true
        params.customer = req.body.customerId || await stripe.customers.create().then(data => data.id)
      }

      const customer = await stripe.customers.create({
        name: 'Jenny Rosen',
        address: {
          line1: '510 Townsend St',
          postal_code: '98140',
          city: 'San Francisco',
          state: 'CA',
          country: 'US',
        },
      });

      params.customer = customer.id;

      if (paymentMethodOptions) {
        params.payment_method_options = paymentMethodOptions
      }

      const paymentIntent = await stripe.paymentIntents.create(params);
      // Send publishable key and PaymentIntent details to client
      res.locals.code = status.OK;
      res.locals.res_obj = {
        clientSecret: paymentIntent.client_secret,
        nextAction: paymentIntent.next_action,
      };
      return next();
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  public static onboardUserToStripeConnect = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    try {
      const accountDetails = {
        type: 'custom',
        country: 'US',
        email: 'code@gmail.com',
        requested_capabilities: ['card_payments', 'transfers'],
        business_type: 'individual',
        individual: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'code@gmail.com',
          address: {
            line1: '123 Main St',
            city: 'Anytown',
            state: 'CA',
            postal_code: '12345',
            country: 'US',
          },
          verification: {
            document: {
              // front: 'file_123',
              // back: 'file_456',
            },
          },
        },
        // external_account: {
        //   object: 'card',
        //   number: '4242424242424242',
        //   exp_month: 10,
        //   exp_year: 2023,
        //   cvc: '123',
        //   currency: 'usd',
        // },
        tos_acceptance: {
          date: Math.floor(Date.now() / 1000),
          ip: '127.0.0.1',
        },
        business_profile: {
          name: 'Example Inc.',
          // url: 'https://example.com',
          support_phone: '+19842076461',
        },
        settings: {
          payouts: {
            schedule: {
              interval: 'daily',
            },
          },
          branding: {
            // icon: 'file_234',
          },
          card_payments: {
            decline_on: {
              cvc_failure: true,
            },
          },
        },
        metadata: {
          custom_id: '123',
          preferences: 'example',
        },
      }

      const account = await stripe.accounts.create(accountDetails);

      const accountId = account.id;
      const redirectUrl = 'http://localhost:3000/';
      // Create the account link with the pre-filled data
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: 'http://localhost:3000/payment/make-payment',
        return_url: redirectUrl,
        type: 'account_onboarding',
      });

      res.locals.code = status.OK;
      res.locals.res_obj = accountLink
      return next();

    } catch (error) {
      console.log(error);
      next(error);
    }


  }

  public static splitTransferPayment = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 10000,
        currency: 'usd',
        automatic_payment_methods: { enabled: true },
        transfer_data: {
          amount: 800,
          destination: 'acct_1MxjBaRFUZ3CN3a6',
        },
      });

      console.log(paymentIntent);
      res.locals.code = status.OK;
      res.locals.res_obj = paymentIntent
      return next();

    } catch (error) {
      console.log(error);
      next(error);
    }


  }

  public static transferMoneyToConnectedAccount = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    try {
      const transfer = await stripe.transfers.create({
        amount: 4000,
        currency: 'usd',
        destination: 'acct_1MxjBaRFUZ3CN3a6',
        transfer_group: 'ORDER_95',
      });

      console.log(transfer);
      res.locals.code = status.OK;
      res.locals.res_obj = transfer
      return next();

    } catch (error) {
      console.log(error);
      next(error);
    }


  }

  public static refundMoenytoUser = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: "pi_3MyTkuEqEyFlGO8P1sM5V2Qj",
        // amount: 1000,
      });
      res.locals.code = status.OK;
      console.log('refund: ', refund);
      res.locals.res_obj = refund
      return next();

    } catch (error) {
      console.log(error);
      next(error);
    }


  }

  public static refundMoneytoUserStripeConnect = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    try {
      // const charge = await stripe.charges.retrieve('ch_3MyT8eEqEyFlGO8P00aHdrlX');
      
      const refund = await stripe.refunds.create({
        payment_intent: 'pi_3MyTosEqEyFlGO8P1DOf0mmH',
        reason: 'requested_by_customer',
      }, {
        stripeAccount: 'acct_1MwevgEqEyFlGO8P',
      });

      res.locals.code = status.OK;
      res.locals.res_obj = refund
      return next();

    } catch (error) {
      console.log(error);
      next(error);
    }


  }


}
