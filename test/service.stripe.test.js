'use strict';

const chai = require('chai');
const expect = chai.expect;
const { stripeService } = require('../server/lib/services/stripe-service');
const Stripe = require('stripe');

const CUSTOMER_DETAILS = {
    id: 1,
    fullName: 'Test User',
    email: 'test@email.com',
    card: {
        "number": '4242424242424242',
        "exp_month": 12,
        "exp_year": 2045,
        "cvc": '123'
    }
};
let token;
let customer;
let charge;
let stripe;
let cards;

describe('check whether able to make payment with Stripe', () => {

    before(async function() {
        stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        token = await stripe.tokens.create({ card: CUSTOMER_DETAILS.card });
    });

    it('should return a customer response', async function() {
        customer = await stripeService.createCustomer({ loggerInUserDetails: CUSTOMER_DETAILS, chargeData: { 'token': token } });
        expect(customer.object).to.eql('customer');
        expect(customer.email).to.eql(CUSTOMER_DETAILS.email);
    });

    it('should create charge for the above customer', async function() {
        CUSTOMER_DETAILS.stripeCustomerId = customer.id;
        charge = await stripeService.createChargeWithSavedCard({ loggerInUserDetails: CUSTOMER_DETAILS, chargeData: { 'source': token.card.id, 'amount': 2000, 'currency': 'usd' } });
        expect(charge.amount).to.eql(2000);
        expect(charge.currency).to.eql('usd');
        expect(charge.object).to.eql('charge');
        expect(charge.status).to.eql('succeeded');
    });

    it('should list all cards for a customer', async function() {
        CUSTOMER_DETAILS.stripeCustomerId = customer.id;
        cards = await stripeService.listAllCards(CUSTOMER_DETAILS);
        expect(cards.data.length).to.eql(1);
        expect(cards.data[0].id).to.eql(`${token.card.id}`);
    });


    after(async function() {
        const result = await stripe.customers.del(`${CUSTOMER_DETAILS.stripeCustomerId}`);
        expect(result.deleted).to.be.true;
    });

});


describe('check whether able to make payment with unsaved card', () => {
    before(async function() {
        stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        token = await stripe.tokens.create({ card: CUSTOMER_DETAILS.card });
    });

    it('should return a charge response', async function() {
        charge = await stripeService.createChargeWithOutSavedCard({ 'token': token, 'amount': 2000, 'currency': 'usd' });
        expect(charge.amount).to.eql(2000);
        expect(charge.currency).to.eql('usd');
        expect(charge.object).to.eql('charge');
        expect(charge.status).to.eql('succeeded');
    });
});