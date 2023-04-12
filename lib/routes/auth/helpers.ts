import * as moment from 'moment';
import * as StandardError from 'standard-error';
import validator from 'validator';
import * as status from 'http-status';
import fetch from 'node-fetch';
import { config } from '../../config';
import * as atob from 'atob';
const environment = 'production';

export const getJwtPayload = (user) => {
  return {
    valid: true,
    firstName: user.name.first,
    lastName: user.name.last,
    id: user._id.toString(),
    stripeCustomerId: user.stripeCustomerId,
    cardToken: user.cardToken,
    expires: moment.utc().add(1, 'day').format('YYYY-MM-DD HH:mm')
  };
};

export const validateRegisterFields = ({ email, password, oauth, name }) => {
  if (!name.first || !name.last) {
    throw new StandardError({ message: 'First and last name is required', code: status.UNPROCESSABLE_ENTITY });
  }

  if (!validator.matches(`${name.first} ${name.last}`, /^[a-zA-Z ]{2,30}$/)) {
    throw new StandardError({ message: 'Invalid name, valid Charactors include (A-Z) (a-z)', code: status.UNPROCESSABLE_ENTITY });
  }

  if (!email) {
    throw new StandardError({ message: 'Email is required', code: status.UNPROCESSABLE_ENTITY });
  }

  if (!validator.isEmail(email)) {
    throw new StandardError({ message: 'Invalid email', code: status.UNPROCESSABLE_ENTITY });
  }

  if (!password) {
    throw new StandardError({ message: 'Password is required', code: status.UNPROCESSABLE_ENTITY });
  }

  if (!validator.isStrongPassword(password)) {
    throw new StandardError({ message: 'Password must contain at least 8 characters, including upper and lowercase characters, a number and a special character.', code: status.UNPROCESSABLE_ENTITY });
  }
};

export const verifySocialLoginRegister = async ({ oauth, accessToken, email }) => {
  if (config.NODE_ENV === environment ) {
    if (!accessToken) {
      throw new StandardError({ message: 'OAuth token is required', code: status.UNPROCESSABLE_ENTITY });
    }

    switch (oauth) {
      case 'GOOGLE':
        const googleResponse = await fetch(`${config.GOOGLE_VERIFY_OAUTH_URL}?access_token=${accessToken}`);
        if (!googleResponse.ok) {
          throw new StandardError({ message: 'Invalid Token', code: status.UNPROCESSABLE_ENTITY });
        }
        break;
      case 'FACEBOOK':
        const facebookFesponse = await fetch(`${config.FACEBOOK_VERIFY_OAUTH_URL}?access_token=${accessToken}`);
        if (!facebookFesponse.ok) {
          throw new StandardError({ message: 'Invalid Token', code: status.UNPROCESSABLE_ENTITY });
        }
        break;
      case 'MICROSOFT':
        const microsoftResponse = await fetch(`${config.MICROSOFT_VERIFY_OAUTH_URL}`, {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ accessToken }` }
        });
        if (!microsoftResponse.ok) {
          throw new StandardError({ message: 'Invalid Token', code: status.UNPROCESSABLE_ENTITY });
        }
        break;
      case 'APPLE':
        const encodedStringArray = accessToken.split('.');
        const decodedData = JSON.parse(atob(encodedStringArray[1]));
        if (decodedData.email !== email) {
          throw new StandardError({ message: 'Invalid Token', code: status.UNPROCESSABLE_ENTITY });
        }
        if (decodedData.aud !== config.APPLE_CLIENT_ID && decodedData.aud !== config.APPLE_CLIENT_ID_IOS) {
          throw new StandardError({ message: 'Invalid Token', code: status.UNPROCESSABLE_ENTITY });
        }
        break;
      default:
        throw new StandardError({ message: `${oauth} OAuth is not allowed`, code: status.UNPROCESSABLE_ENTITY });
    }
  }
};
