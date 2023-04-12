const sgMail = require("@sendgrid/mail");
import { config } from '../config';

export class EmailService {
  supportEmail;
  sendgridTemplateID;
  testEmail: string = config.SENDGRID_TEST_EMAIL;
  environment: string = 'production'
  constructor() {
    sgMail.setApiKey(config.SENDGRID_API_KEY);
  }
  public contactFormSubmission = ({ name, email, message }) => {
    let mailOptions = {
      from: config.SENDGRID_USER_EMAIL,
      to: config.SENDGRID_USER_EMAIL,
      subject: `${name} Contact Form Submission`,
      text: `
      Name: ${name},
      Email: ${email},
      Message: ${message}
      `,
    };
    return this.sendgridEmail(mailOptions)
  };

  public sendPWResetEmail = (email, link) => {
    let mailOptions = {
      from: config.SENDGRID_USER_EMAIL,
      to: email,
      subject: "Reset Password",
      html: link,
    };
    return this.sendgridEmail(mailOptions)
  };

  public sendEmail = async ({ subject, email, data }) => {
    let mailOptions = {
      from: config.SENDGRID_USER_EMAIL,
      to: email,
      subject: subject,
      text: data,
    };

    try {
      return this.sendgridEmail(mailOptions)
    } catch (error) {
      console.log(error.response.body, "Email Error");
    }
  };

  public sendgridTemplate = async ({ data, client }) => {
    const clientFullName = client.fullName
      ? client.fullName.toUpperCase()
      : " User";
    const adminMailRestaurantOptions = {
      from: `${this.supportEmail}`,
      to: `${client.email}`,
      templateId: this.sendgridTemplateID,
      dynamic_template_data: { data },
    };
    try {
      await sgMail.send(adminMailRestaurantOptions);
    } catch (e) {
      console.log(e.response.body, "Email Error");
    }
  };

  public newSubscriptionEmail = (userDetails) => {
    let mailOptions = {
      from: config.SENDGRID_USER_EMAIL,
      to: userDetails.email,
      subject: ` Welcome`,
      text: `
      Hey ${userDetails.fullName},
      Thanks for joining.
      `,
    };
    return this.sendgridEmail(mailOptions)
  };

  public subscriptionRenewalSuccessEmail = (userDetails) => {
    let mailOptions = {
      from: config.SENDGRID_USER_EMAIL,
      to: userDetails.email,
      subject: `${userDetails.fullName} renewal Success`,
      text: `
      Hey ${userDetails.fullName},
      Your  subscription is renewed.
      `,
    };
    return this.sendgridEmail(mailOptions)
  };

  public subscriptionRenewalFailedEmail = (userDetails) => {
    let mailOptions = {
      from: config.SENDGRID_USER_EMAIL,
      to: userDetails.email,
      subject: `${userDetails.fullName} Welcome`,
      text: `
      Hey ${userDetails.fullName},
      We were not able to renew your subscription. Please manually renew it.
      `,
    };
    return this.sendgridEmail(mailOptions)
  };



  public sendCancellationEmail = (userDetails) => {
    let mailOptions = {
      from: config.SENDGRID_USER_EMAIL,
      to: userDetails.email,
      subject: `${userDetails.fullName}  Subscription cancelled!`,
      text: `
      Hey ${userDetails.fullName},
      We have successfully cancelled you renewal .
      `,
    };
    return this.sendgridEmail(mailOptions)
  };

  public inviteUserEmail = (details : { email: string, link: string }) => {
    let mailOptions = {
      from: config.SENDGRID_USER_EMAIL,
      to: details.email,
      subject: `${details.email} Welcome`,
      html: `
      <p>Hey ${details.email},</p>
      <p>You've been invited to sign up on Byldd's boilerplate.</p>
      <p>Please click <a href="${details.link}"">here</a></p>
      `,
    };
    return this.sendgridEmail(mailOptions)
  };

  public refundEmail = (details : { email: string, amount: number, currency: string, status: string }) => {
    let mailOptions = {
      from: config.SENDGRID_USER_EMAIL,
      to: details.email,
      subject: `Refund`,
      html: `
      <p>Hey ${details.email},</p>
      <p>Refund of amount ${details.currency} ${details.amount} has been initiated with the status of ${details.status}.</p>
      `,
    };
    
    return this.sendgridEmail(mailOptions)
  };

  private sendgridEmail = (mailOptions : any) => {
    if(config.NODE_ENV !== this.environment){
      mailOptions.to = this.testEmail;
    }
    return sgMail.send(mailOptions);
  }
}
