import * as mailchimp from 'mailchimp-api-v3';
import * as crypto from 'crypto';

import { config } from '../config';
class MailchimpService {
  private mailchimp: any;
  private LIST_URL: string;
  constructor() {
    this.mailchimp = new mailchimp(config.MAILCHIMP_KEY);
    this.LIST_URL = `/lists/${config.MAILCHIMP_LIST_ID}/members`;
  }

  private getUserHash = (user) => {
    return crypto.createHash('md5').update(user.email).digest('hex');
  }

  public registerUser = async (user) => {
    return this.mailchimp.post(this.LIST_URL, {
      email_address : user.email,
      status : 'subscribed'
    });
  }

  public unregisterUser = (user) => {
    const userHash = this.getUserHash(user);
    return this.mailchimp.patch(`${this.LIST_URL}/${userHash}`, { status: 'unsubscribed' });
  }
}

export const mailchimpService = new MailchimpService();
