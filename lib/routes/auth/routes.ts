// NPM Dependencies
import * as express from 'express';
import * as status from 'http-status';
import * as StandardError from 'standard-error';
import * as jwt from 'jwt-simple';
import * as jsonwt from 'jsonwebtoken';
import { EmailService } from '../../services/email';
import validator from 'validator';

// Import config
import { config } from '../../config';
import { AuthenticatedRequest } from '../../interfaces/authenticated-request';

// Internal Dependencies
import { User, Company } from '../../db';

// Helpers
import { getJwtPayload, validateRegisterFields, verifySocialLoginRegister } from './helpers';

// Fiebase admin service
import { firebaseService } from '../../services/firebaseAdmin';

export class AuthRoutes {
  static JWT_SECRET: string = config.JWT_SECRET || 'i am a tea pot';

  public static register = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {

      const { email, password, oauth, name, isInvited } = req.body.user;

      validateRegisterFields(req.body.user);

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new StandardError({ message: 'Email already in use', code: status.CONFLICT });
      }

      const firebaseAuthUser = await firebaseService.createUser(name, email, password);
      const { uid } = firebaseAuthUser;
      let companyId: string;
      if (!isInvited) {
        const createdCompany = await Company.create({ name: email });
        companyId = createdCompany._id;
      }
      const user = await User.create({ email, firebaseUid: uid, name, oauth, hasPassword: true, companyId });
      if (!isInvited) {
        await Company.findByIdAndUpdate(companyId, { userId: user._id });
      }

      res.locals.code = status.OK;
      res.locals.res_obj = {
        token: jwt.encode(getJwtPayload(user), AuthRoutes.JWT_SECRET),
        user
      };
      return next();
    } catch (error) {
      next(error);
    }
  }
  public static registerLoginOauth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const { email, oauth, name, accessToken, firebaseUid, isInvited } = req.body.user;
      await verifySocialLoginRegister(req.body.user);
      if (!email) {
        throw new StandardError({ message: 'Email is required', code: status.UNPROCESSABLE_ENTITY });
      }
      if (!validator.isEmail(email)) {
        throw new StandardError({ message: 'Invalid email', code: status.UNPROCESSABLE_ENTITY });
      }
      let user = await User.findOne({ email });
      let message: string;
      if (user) {
        message = 'Logged In';
      } else {
        let companyId: string;
        if (!isInvited) {
          const createdCompany = await Company.create({ name: email });
          companyId = createdCompany._id;
        }
        user = await User.create({ email, oauth, name, firebaseUid, companyId });
        if (!isInvited) {
          await Company.findByIdAndUpdate(companyId, { userId: user._id });
        }
        message = 'Registered Successfully';
      }
      res.locals.code = status.OK;
      res.locals.res_obj = { token: jwt.encode(getJwtPayload(user), AuthRoutes.JWT_SECRET), user, message };
      return next();
    } catch (error) {
      next(error);
    }
  }

  public static login = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const { email, password } = req.body.user;

      if (!email || !password) {
        throw new StandardError({ message: 'Email and Password are requried', code: status.UNPROCESSABLE_ENTITY });
      }

      // const firebaseUser: any = (await firebaseService.signInUser(email, password)).user.toJSON();
      // console.log('firebaseUser: ', firebaseUser);
      
      // const user = await User.findOne({ firebaseUid: firebaseUser.uid });
      const user = await User.findOne({ email: email });
      if (!user) {
        throw new StandardError({ message: 'Invalid email or password', code: status.CONFLICT });
      }

      res.locals.code = status.OK;
      res.locals.res_obj = { token: jwt.encode(getJwtPayload(user), AuthRoutes.JWT_SECRET), user };
      return next();
    } catch (error) {
      next(error);
    }
  }

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
      const token = jsonwt.sign({ exp: Math.floor(Date.now() / 1000) + (60 * 60), email_id: email }, AuthRoutes.JWT_SECRET);
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
      const decoded: any = await jsonwt.verify(token, AuthRoutes.JWT_SECRET);
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

      const decoded: any = await jsonwt.verify(token, AuthRoutes.JWT_SECRET);
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
          await User.update({ email }, { hasPassword: true });
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
        res.locals.res_obj = { token: jwt.encode(getJwtPayload(user), AuthRoutes.JWT_SECRET), user };
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

}
