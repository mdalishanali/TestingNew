// NPM Dependencies
import * as express from 'express';
import * as status from 'http-status';
import * as StandardError from 'standard-error';
import validator from 'validator';
import * as jwt from 'jwt-simple';
import * as jsonwt from 'jsonwebtoken';
import { EmailService } from '../../services/email';
import { AuthenticatedRequest } from '../../interfaces/authenticated-request';
// import { mailchimpService } from '../../services/mailchimp';

// import config
import { config } from '../../config';

// Internal Dependencies
import { User } from '../../db';

// Helpers
import { getJwtPayload } from './helpers';
import { firebaseService } from '../../services/firebaseAdmin';

export class UserRoutes {
  static JWT_SECRET: string = config.JWT_SECRET || 'i am a tea pot';
  public static sendResetEmail = async (req: express.Request, res: express.Response, next: express.NextFunction) => {

    try {
      const emailService = new EmailService();
      const email = req.body.email;

      if (!email) {
        throw new StandardError({ message: 'Email is requried ', code: status.UNPROCESSABLE_ENTITY });
      }
      const user = await User.findOne({ email });

      if (!user) {
        throw new StandardError({ message: 'Invalid email ', code: status.CONFLICT });
      }

      const host = `${req.protocol}://${config.HOST}`;


      const link = `${host}/api/auth/reset-password/`;
      const token = jsonwt.sign({ exp: Math.floor(Date.now() / 1000) + (60 * 60), email_id: email }, UserRoutes.JWT_SECRET);
      const callbackUrl = `<p>Click <a href='${link}${token}'>here</a> to reset your password</p>`;
      const result = await emailService.sendPWResetEmail(email, callbackUrl);
      res.locals.code = status.OK;
      res.locals.res_obj = result;
      return next();
    } catch (error) {
      next(error);
    }
  }
  public static resetPassword = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const host = `${req.protocol}://${config.HOST}`;
      const token = req.params.token;
      const decoded: any = await jsonwt.verify(token, UserRoutes.JWT_SECRET);
      if (decoded) {
        const email = decoded.email_id;
        res.redirect(301, `${host}/reset?email=${email}&token=${token}`);
      }
    } catch (error) {
      next(error);
    }
  }
  public static updatePassword = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {

      const { email, password, token } = req.body.data;

      if (!email) {
        throw new StandardError({ message: 'Email is required', code: status.UNPROCESSABLE_ENTITY });
      }

      if (!password) {
        throw new StandardError({ message: 'Password is required', code: status.UNPROCESSABLE_ENTITY });
      }

      else if (!validator.isStrongPassword(password)) {
        throw new StandardError({ message: 'Password must contain at least 8 characters, including upper and lowercase characters, a number and a special character.', code: status.UNPROCESSABLE_ENTITY });
      }

      const decoded: any = await jsonwt.verify(token, UserRoutes.JWT_SECRET);
      if (decoded) {
        const decodedemail = decoded.email_id;
        if (decodedemail === email) {
          const existingUser = await User.findOne({ email });
          if (!existingUser) {
            throw new StandardError({
              message: 'Email is not registerd',
              code: status.CONFLICT,
            });
          }
          const user = await firebaseService.updateUserPassword(existingUser.firebaseUid, password);
          await User.updateOne({ email }, { hasPassword: true });
          if (user) {
            res.locals.code = status.OK;
            res.locals.res_obj = existingUser;
            return next();
          }
        } else {
          throw new StandardError({
            message: 'Email is not valid',
            code: status.CONFLICT,
          });
        }
      } else {
        throw new StandardError({
          message: 'Email is not found',
          code: status.CONFLICT,
        });
      }
    } catch (error) {
      next(error);
    }
  }

  public static changePassword = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    try {
      const { currentPassword, newPassword } = req.body.passwordDetails;
      const match = await firebaseService.signInUser(req.user.email, currentPassword);
      if (!match) {
        throw new StandardError({ message: 'Invalid password', code: status.CONFLICT });
      }

      if (!validator.isStrongPassword(newPassword)) {
        throw new StandardError({ message: 'Password must contain at least 8 characters, including upper and lowercase characters, a number and a special character.', code: status.UNPROCESSABLE_ENTITY });
      }
      else {
        await firebaseService.updateUserPassword(req.user.firebaseUid, newPassword);
        const user = await User.findById(req.user._id);
        res.locals.code = status.OK;
        res.locals.res_obj = { token: jwt.encode(getJwtPayload(user), UserRoutes.JWT_SECRET), user };
        return next();
      }
    } catch (error) {
      next(error);
    }
  }

  public static me = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    try {
      if (!req.user) {
        res.locals.code = status.UNAUTHORIZED;
      } else {
        res.locals.code = status.OK;
        res.locals.res_obj = req.user;
      }
      return next();
    } catch (error) {
      next(error);
    }
  }

  public static unsubscribe = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const id = req.params.id;
      const user = await User.findByIdAndUpdate(id, { subscribedToNewsletter: false });
      res.locals.code = status.OK;
      res.locals.res_obj = user;
      return next();
    } catch (error) {
      next(error);
    }
  }

  public static deleteFirebaseUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const uid = req.params.uid;
      const data = firebaseService.deleteUser(uid);
      res.locals.code = status.OK;
      res.locals.res_obj = data;
      return next();
    } catch (error) {
      next(error);
    }
  }

  public static updateProfile = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    try {
      const { name, stripeAccountId } = req.body.update;
      const update: any = {};
      if (name && !name.first || !name.last) {
        throw new StandardError({ message: 'First and last name are required!', code: status.CONFLICT });
      } else {
        update.name = name;
      }
      if (stripeAccountId) {
        update.stripeAccountId = stripeAccountId
      }
      const user = req.user;
      await User.updateOne({ _id: user._id }, update, { new: true });
      const updatedUser = await User.findOne({ _id: user._id });
      res.locals.code = status.OK;
      res.locals.res_obj = {
        token: jwt.encode(getJwtPayload(user), UserRoutes.JWT_SECRET),
        user: updatedUser
      };
      return next();
    } catch (error) {
      next(error);
    }
  }
}
