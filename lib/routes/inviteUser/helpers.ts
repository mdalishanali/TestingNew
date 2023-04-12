import * as jwt from 'jsonwebtoken';
import * as status from 'http-status';
import { InvitedUsers, User, Company } from '../../db';
import { EmailService } from '../../services/email';
import * as StandardError from 'standard-error';
import * as moment from 'moment';
import { config } from '../../config';

const JWT_SECRET: string = config.JWT_SECRET ? config.JWT_SECRET : 'i am a tea pot';

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

export const addCompanyInAUser = async (user) => {
  if (!Boolean(user.companyId)) {
    const createdCompany = await Company.create({ name: user.email, userId: user._id });
    await User.updateOne(
      { _id: user._id },
      { companyId: createdCompany._id }
    );
  }
};

export class InviteUsersHelpers {

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
      const data = await InvitedUsers.updateOne({ invitedEmail: email }, { expiry: new Date(Date.now() + 1 * (60 * 60 * 1000)), cancelled: false });
      const mailData = createInviteMailData(email, protocol);
      emailService.inviteUserEmail(mailData);
      return {
        message: `Invitation email re-sent successfully to ${email}`,
      };
    } else {
      throw new StandardError({
        message: `${email} is not invited`,
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
      message: `Mail with invite sent successfully ${alreadyInvitedEmails.length > 0 ? `except for ${alreadyInvitedEmails.toString()} as they are already invited` : ''}`,
    };
  }

  public static invitedUsers = async (companyId: any) => {
    const pendingInvites = await InvitedUsers.find({
      companyId: companyId._id,
      isAccepted: false,
      cancelled: false,
      expiry: { $gt: Date.now() }
    });

    const expiredInvites = await InvitedUsers.find({
      companyId: companyId._id,
      isAccepted: false,
      $or: [
        { expiry: { $lt: Date.now() } },
        { cancelled: true }
      ]
    });

    const acceptedInvites = await InvitedUsers.aggregate([
      {
        $match: {
          isAccepted: true,
          companyId: companyId._id
        },
      },
      {
        $lookup: {
          from: 'users',
          let: { companyIds: '$companyId', email: '$invitedEmail' },
          pipeline: [
            {
              $match: {
                $and: [
                  { $expr: { $eq: ['$companyId', '$$companyIds'] } },
                  { $expr: { $eq: ['$email', '$$email'] } },
                ]
              },
            },
            {
              $project: {
                _id: 1,
                name: 1,
                email: 1
              },
            },
          ],
          as: 'userInfo',
        },
      },
      {
        $unwind: '$userInfo'
      }
    ]);

    return { pendingInvites, acceptedInvites, expiredInvites };
  }

  public static acceptInvite = async (inviteToken: string, userEmail: string) => {

    const decoded: any = await jwt.verify(inviteToken, JWT_SECRET);

    if (!decoded) {
      throw new StandardError({
        message: 'Invalid or expired invie token',
        code: status.UNPROCESSABLE_ENTITY,
      });
    }

    if (decoded.email !== userEmail) {
      throw new StandardError({
        message: `this invitation does not belong to '${userEmail}'.`,
        code: status.UNPROCESSABLE_ENTITY,
      });
    }

    const user = await User.findOne({ email: userEmail });

    if (!Boolean(user)) {
      throw new StandardError({
        message: 'Email not registered',
        code: status.UNAUTHORIZED,
      });
    }

    if (Boolean(user.referredBy)) {
      throw new StandardError({
        message: 'You have accepted one invitation already',
        code: status.UNPROCESSABLE_ENTITY,
      });
    }

    const invite = await InvitedUsers.findOne({
      invitedEmail: userEmail,
    });

    if (!Boolean(invite)) {
      await addCompanyInAUser(user);
      throw new StandardError({
        message: `You email '${userEmail}' is not invited.`,
        code: status.UNPROCESSABLE_ENTITY,
      });
    }

    if (moment(invite.expiry).isBefore(Date.now())) {
      await addCompanyInAUser(user);
      throw new StandardError({
        message: 'Invitation is expired',
        code: status.UNPROCESSABLE_ENTITY,
      });
    }

    if (invite.cancelled === true) {
      await addCompanyInAUser(user);
      throw new StandardError({
        message: 'Invitation is cancelled',
        code: status.UNPROCESSABLE_ENTITY,
      });
    }

    const referredBy = invite.userId;
    const inviter = await User.findById(invite.userId).lean();
    let isInviterSuperAdmin: boolean = false;
    let newCompanyId: string = '';

    if (!Boolean(invite.companyId) && inviter.roles === 'Super Admin') {
      isInviterSuperAdmin = true;
      const createdCompany = await Company.create({ name: userEmail, userId: user._id });
      newCompanyId = createdCompany._id;
    }

    await User.updateOne(
      { _id: user._id },
      { referredBy, roles: invite.role, companyId: isInviterSuperAdmin ? newCompanyId : invite.companyId },
      { new: true }
    );

    await InvitedUsers.updateOne(
      { _id: invite._id },
      { isAccepted: true },
      { new: true }
    );

    return { message: 'Invitation accepted successfully' };
  }
}
