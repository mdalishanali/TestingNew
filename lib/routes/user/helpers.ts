import * as moment from 'moment';

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
