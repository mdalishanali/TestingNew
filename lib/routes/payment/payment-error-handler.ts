import * as StandardError from 'standard-error';
import { EmailService } from './../../services/email';

export class PaymentErrorHandlerService {

    public static PaymentErrorHandleError = ( error, next , userEmail?) => {
        const email = new EmailService();
        switch (error.type) {
            case 'StripeCardError':
                // A declined card error
                next(new StandardError({ message: error.message, code: error.statusCode })); // => e.g. "Your card's expiration year is invalid."
                break;
            case 'RateLimitError':
                // Too many requests made to the API too quickly
                next(new StandardError({ message: error.message, code: error.statusCode }));
                break;
            case 'StripeInvalidRequestError':
                // Invalid parameters were supplied to Stripe's API
                next(new StandardError({ message: error.message, code: error.statusCode }));
                break;
            case 'StripeAPIError':
                // An error occurred internally with Stripe's API
                next(new StandardError({ message: error.message, code: error.statusCode }));
                break;
            case 'StripeConnectionError':
                // Some kind of error occurred during the HTTPS communication
                next(new StandardError({ message: error.message, code: error.statusCode }));
                break;
            case 'StripeAuthenticationError':
                // You probably used an incorrect API key.
                next(new StandardError({ message: error.message, code: error.statusCode }));
                break;
            default:
                // Handle any other types of unexpected errors
                next(new StandardError({ message: error.message, code: error.statusCode }));
                break;
        }

    }
}
