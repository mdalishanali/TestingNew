import * as Twilio from 'twilio';
//import config
import { config } from '../config'

const twilioNumber = config.TWILIO_NUMBER;
const accountSid = config.TWILIO_ACCOUNTSID;
const authToken = config.TWILIO_AUTHTOKEN;

export class MessageService {
  client;
  constructor() {
    this.client = Twilio(accountSid, authToken);
  }

  public sendMessages = (number, message) => {
    const textContent = {
      body: message,
      to: number,
      from: twilioNumber
    };

    return this.client.messages.create(textContent)
      .then((res) => res);
  }
  // Validate E164 format
  public validE164 = (num) => {
    return /^\+?[1-9]\d{1,14}$/.test(num);
  }
}
