import * as status from 'http-status';
import { Company, User, InvitedUsers } from '../../../db';
import * as StandardError from 'standard-error';
import { config } from '../../../config';
import * as mongoose from 'mongoose';
import { EmailService } from '../../../services/email';
import * as jwt from 'jsonwebtoken';
import { PaginatedSearchQuery } from '../../../interfaces/query';
import { CompanyInterface } from '../../../interfaces/schemaInterface';

const ObjectId = mongoose.Types.ObjectId;

const JWT_SECRET = config.JWT_SECRET ?  config.JWT_SECRET : 'i am a tea pot';
const createInviteMailData = (email: string, protocol: string) => {
  const host = `${protocol}://${config.HOST}`;
  const token = jwt.sign({ exp: Math.floor(Date.now() / 1000) + (60 * 60), email: email }, JWT_SECRET);
  const link = `${host}/api/accept-invite/invite/?inviteToken=${token}`;
  const mailData = {
    email,
    link: link,
  };
  return mailData;
};

export class CompanyHelpers {
    public static getCompanies = async (query: PaginatedSearchQuery) => {
        const page = Number(query.page) || 1;
        const limit = Number(query.pageSize) || 50;
        const skips = (page - 1) * limit;
        const searchValue = query.searchValue;
        const matchObj: any = {};
        if (Boolean(searchValue)) {
          matchObj.$text = { $search: searchValue };
        }
        const data = await Company.aggregate([
          {
            $match: matchObj
          },
          {
            $facet: {
              data: [
                {
                  $skip: skips,
                },
                {
                  $limit: limit,
                },
              ],
              count: [
                {
                  $count: 'count',
                },
              ],
            },
          },
        ]);
        return data;
      }

    public static getCompanyUsers = async (companyId: string, query: PaginatedSearchQuery) =>  {
      const page = Number(query.page) || 1;
      const limit = Number(query.pageSize) || 50;
      const skips = (page - 1) * limit;
      const searchValue = query.searchValue;
      const matchObj: any = { companyId: ObjectId(companyId) };
      if (Boolean(searchValue)) {
        matchObj.$text = { $search: searchValue };
      }
      const data = await User.aggregate([
        {
          $match: matchObj
        },
        {
          $facet: {
            data: [
              {
                $skip: skips,
              },
              {
                $limit: limit,
              },
            ],
            count: [
              {
                $count: 'count',
              },
            ],
          },
        },
      ]);
      return data;
    }

    public static getCompanyInviteDetails = async (companyId: string) =>  {
      const pendingInvites = await InvitedUsers.find({
        companyId,
        isAccepted: false,
        cancelled: false,
        expiry: { $gt: Date.now() }
      });
      const expiredInvites = await InvitedUsers.find({
        companyId,
        isAccepted: false,
        $or: [
          { expiry: { $lt: Date.now() } },
          { cancelled: true }
        ]
      });
      return { pendingInvites, expiredInvites };
  }

    public static updateCompany = async (id: string, update: CompanyInterface) =>  {
      const data = await Company.findByIdAndUpdate(id, update, { new: true });
      return data;
  }

  public static getCompanyDetails = async (id: string) =>  {
    const data = await Company.findById(id);
    return data;
}

  public static changeUserRole = async (userId: string, companyId: string, roles: string) =>  {
    const data = await User.updateOne( { _id: userId, companyId }, { roles }, { new: true });
    return data;
  }

  public static cancelInvite = async (inviteId: string, companyId: string) => {
    const emailService = new EmailService();
    const existingInvitation = await InvitedUsers.findOne({
      _id: inviteId, companyId
    });
    if (existingInvitation) {
      const data = await InvitedUsers.updateOne({ _id: inviteId }, { cancelled: true });
      return {
        message: `Invitation cancelled successfully`,
      };
    } else {
      throw new StandardError({
        message: `Invalid invite`,
        code: status.CONFLICT,
      });
    }
  }

  public static resendInvitation = async (email: string, companyId: string, protocol: string) => {
    const emailService = new EmailService();
    const existingInvitation = await InvitedUsers.findOne({
      invitedEmail: email, companyId
    });
    if (existingInvitation) {
      const data = await InvitedUsers.updateOne({ invitedEmail: email }, { expiry: new Date(Date.now() + 1 * (60 * 60 * 1000) ), cancelled: false });
      const mailData = createInviteMailData(email, protocol);
      emailService.inviteUserEmail(mailData);
      return {
        message: `Invitation email re-sent successfully to ${ email }`,
      };
    } else {
      throw new StandardError({
        message: `${ email } is not invited`,
        code: status.CONFLICT,
      });
    }
  }

  public static inviteUsers = async (emails: { role: string, email: string }[], companyId: string, userId: string, protocol: string) => {
    const emailService = new EmailService();

    const asyncFilter = async (emailsList, predicate) => {
      const results = await Promise.all(emailsList.map(predicate));

      return emailsList.filter((_v, index) => results[index]);
    };

    const alreadyInvited = await asyncFilter(emails, async (emailObj) => {
      let isInvited = false;
      const existingInvitation = await InvitedUsers.findOne({
        invitedEmail: emailObj.email
      });
      if (existingInvitation) {
        isInvited = true;
      } else {
        const inviation = {
          invitedEmail: emailObj.email,
          companyId, userId,
          role: emailObj.role
        };
        const data = await InvitedUsers.create(inviation);
        const mailData = createInviteMailData(emailObj.email, protocol);
        emailService.inviteUserEmail(mailData);
      }
      if (isInvited) {
        return true;
      }
    });

    const alreadyInvitedEmails = alreadyInvited.map((item) => {
      return item.email;
    });

    return {
      message: `Mail with invite sent successfully ${ alreadyInvitedEmails.length > 0 ? `except for ${alreadyInvitedEmails.toString()} as they are already invited` : ''}`,
    };
  }
}
