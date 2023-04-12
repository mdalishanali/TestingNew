import * as status from 'http-status';
import * as express from 'express';
import * as StandardError from 'standard-error';
import * as jwt from 'jsonwebtoken';
import * as moment from 'moment';
import { config } from '../../config';
import { InviteUsersHelpers, addCompanyInAUser } from './helpers';
import { AuthenticatedRequest } from '../../interfaces/authenticated-request';

import { InvitedUsers, User, Company } from '../../db';

const JWT_SECRET: string = config.JWT_SECRET || 'i am a tea pot';

export class InviteUserRoutes {

  public static checkInvitation = async (
    req: AuthenticatedRequest,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const host = `${req.protocol}://${config.HOST}`;
      const token: any = req.query.inviteToken;
      const decoded: any = await jwt.verify(token, JWT_SECRET);
      if (decoded) {
        const { email } = decoded;
        res.redirect(status.MOVED_PERMANENTLY, `${host}/invites/accept-invite?email=${email}&inviteToken=${token}`);
      }
    } catch (error) {
      next(error);
    }

  }

  public static acceptInvite = async (
    req: AuthenticatedRequest,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const { inviteToken } = req.params;
      const { email } = req.user;

      const data = await InviteUsersHelpers.acceptInvite(inviteToken, email);

      res.locals.code = status.OK;
      res.locals.res_obj = { data };
      return next();
    } catch (error) {
      if (error.message === 'jwt expired') {
        await addCompanyInAUser(req.user);
        error.message = 'Invitatiion is expired';
      }
      next(error);
    }
  }

  public static resendInvites = async (
    req: AuthenticatedRequest,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const email: string = req.body.document.email;
      const companyId = req.user.companyId;
      const data = await InviteUsersHelpers.resendInvitation(email, companyId, req.protocol);
      res.locals.code = status.OK;
      res.locals.res_obj = { data };
      return next();
    } catch (error) {
      next(error);
    }
  }

  public static inviteUser = async (
    req: AuthenticatedRequest,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const emails = req.body.document.emails.length > 0 ? req.body.document.emails : [];
      const companyId = req.user.companyId;
      const userId = req.user._id;
      if (emails.length < 1) {
        throw new StandardError({
          message: 'At least one email is required',
          code: status.CONFLICT,
        });
      }

      const data = await InviteUsersHelpers.inviteUsers(emails, companyId, userId, req.protocol);
      res.locals.code = status.OK;
      res.locals.res_obj = { data };
      return next();
    } catch (error) {
      next(error);
    }
  }

  public static getInvitedUser = async (
    req: AuthenticatedRequest,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const companyId = req.user.companyId;
      const data = await InviteUsersHelpers.invitedUsers(companyId);
      res.locals.code = status.OK;
      res.locals.res_obj = { data };
      return next();
    } catch (error) {
      next(error);
    }
  }

  public static cancelInvite = async (
    req: AuthenticatedRequest,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const inviteId = req.params.id;
      const companyId = req.user.companyId;
      const data = await InviteUsersHelpers.cancelInvite(inviteId, companyId);
      res.locals.code = status.OK;
      res.locals.res_obj = { data };
      return next();
    } catch (error) {
      next(error);
    }
  }
}
