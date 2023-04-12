import * as status from 'http-status';
import * as express from 'express';
import * as StandardError from 'standard-error';

import { CompanyHelpers } from './helpers';
import { AuthenticatedRequest } from '../../../interfaces/authenticated-request';

export class CompanyRoutes {
  public static getCompanies = async (
    req: AuthenticatedRequest,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const query = req.query;
      const data = await CompanyHelpers.getCompanies(query);
      res.locals.code = status.OK;
      res.locals.res_obj = { data };
      return next();
    } catch (error) {
      next(error);
    }
  }

  public static getCompanyUsers = async (
    req: AuthenticatedRequest,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const companyId = req.params.id;
      const query = req.query;
      const data = await CompanyHelpers.getCompanyUsers(companyId, query);
      res.locals.code = status.OK;
      res.locals.res_obj = { data };
      return next();
    } catch (error) {
      next(error);
    }
  }

  public static getCompanyInviteDetails = async (
    req: AuthenticatedRequest,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const companyId = req.params.id;
      const data = await CompanyHelpers.getCompanyInviteDetails(companyId);
      res.locals.code = status.OK;
      res.locals.res_obj = { data };
      return next();
    } catch (error) {
      next(error);
    }
  }

  public static editCompany = async (
    req: AuthenticatedRequest,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const id = req.params.id;
      const update = req.body.update;
      const data = await CompanyHelpers.updateCompany(id, update);
      res.locals.code = status.OK;
      res.locals.res_obj = { data };
      return next();
    } catch (error) {
      next(error);
    }
  }

  public static changeUserRole = async (
    req: AuthenticatedRequest,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const companyId = req.params.id;
      const roles = req.body.update.roles;
      const userId = req.body.update._id;
      const data = await CompanyHelpers.changeUserRole(userId, companyId, roles);
      res.locals.code = status.OK;
      res.locals.res_obj = { data };
      return next();
    } catch (error) {
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
      const companyId = req.params.id;
      const data = await CompanyHelpers.resendInvitation(email, companyId, req.protocol);
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
      const companyId = req.params.id;
      const userId = req.user._id;
      if (emails.length < 1) {
        throw new StandardError({
          message: 'At least one email is required',
          code: status.CONFLICT,
        });
      }

      const data = await CompanyHelpers.inviteUsers(emails, companyId, userId, req.protocol);
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
      const inviteId = req.body.update._id;
      const companyId = req.params.id;
      const data = await CompanyHelpers.cancelInvite(inviteId, companyId);
      res.locals.code = status.OK;
      res.locals.res_obj = { data };
      return next();
    } catch (error) {
      next(error);
    }
  }

  public static getCompanyDetails = async (
    req: AuthenticatedRequest,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const companyId = req.params.id;
      const data = await CompanyHelpers.getCompanyDetails(companyId);
      res.locals.code = status.OK;
      res.locals.res_obj = { data };
      return next();
    } catch (error) {
      next(error);
    }
  }
}
