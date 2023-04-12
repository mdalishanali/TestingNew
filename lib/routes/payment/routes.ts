import * as express from 'express';
import * as status from 'http-status';
import { User, Payment } from './../../db/index';
import { stripeService } from './../../services/stripe-service';
import { PaymentErrorHandlerService } from './payment-error-handler';
import { payPalService } from './../../services/paypal-service';
import { EmailService } from './../../services/email';
import { UsersHelpers } from './helpers/user.helper';
import { AuthenticatedRequest } from '../../interfaces/authenticated-request';

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
        charge = await stripeService.createChargeWithOutSavedCard( chargeData );
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
}
