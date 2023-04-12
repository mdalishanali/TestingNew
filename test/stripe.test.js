const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require("mongoose");
const Stripe = require('stripe');
const server = require('../server/lib/index');
const { User, Payment } = require('../server/lib/db');
const expect = chai.expect;
const utils = require('./utils');
const should = chai.should();
chai.use(chaiHttp);
const status = require('http-status');


// Constants
const dbURI = process.env.DB_PATH;
const DATA_PATH = `test/data/auth.yml`;
const BASE_URL = '/api/payment';

const CUSTOMER_DETAILS = {
    id: 1,
    fullName: 'Byldd Boilerplate',
    email: 'boilerplate@byldd.com',
    card: {
        "number": '4242424242424242',
        "exp_month": 12,
        "exp_year": 2045,
        "cvc": '123'
    }
};

const newCard = {
    "number": '4242424242424242',
        "exp_month": 06,
        "exp_year": 2051,
        "cvc": '456'
}

let newCardId = "";

const user = {
    email: 'test@one.com',
    accessToken: 'this is a test token and backend should accept it in testing environment',
};

let token;
let customer;
let charge;
let stripe;
let cards;
let userToken;
let paymentId;
let chargeId;
let freshPaymentId;


describe('POST /charge/guestCard', function() {

    before(async function() {
        stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        token = await stripe.tokens.create({ card: CUSTOMER_DETAILS.card });
        
    });

    it('should create charge for unauthenticated user', function(done) {
        let url = `${BASE_URL}/charge/guestCard`;
        const chargeData = {
            'currency': 'usd',
            'amount': 2000,
            'token': token,
            'email': CUSTOMER_DETAILS.email
        };

        chai.request(server)
            .post(url)
            .send({ chargeData })
            .end(function(err, res) {
                const paymentResponse = res.body;
                freshPaymentId = paymentResponse.id
                res.should.have.status(200);
                res.should.be.json;
                (paymentResponse.status).should.be.equal('succeeded');
                (paymentResponse.amount).should.be.equal(chargeData.amount);
                (paymentResponse.email).should.be.equal(CUSTOMER_DETAILS.email);
                done();
            });
    });
});

describe('POST /charge/create', function() {

    before(async function() {
        await utils.seedDatabase(dbURI, DATA_PATH, null);
        const userData = await chai.request(server)
            .post('/api/auth/registerLoginOauth')
            .send({ user })
        userToken = userData.body.token;
        stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        token = await stripe.tokens.create({ card: CUSTOMER_DETAILS.card });
        await mongoose.connection.db.collection('users').updateOne({email: user.email}, { $set: { roles: 'Super Admin' } })
    });

    it('should create charge for authenticated user', function(done) {
        let url = `${BASE_URL}/charge/create`;
        const chargeData = {
            'currency': 'usd',
            'amount': 2000,
            'token': token,
            'email': CUSTOMER_DETAILS.email,
        };
        chai.request(server)
            .post(url)
            .set('authorization', userToken)
            .send({ chargeData })
            .end(function(err, res) {
                const paymentResponse = res.body;
                res.should.have.status(200);
                res.should.be.json;
                charge = paymentResponse.id;
                (paymentResponse.status).should.be.equal('succeeded');
                (paymentResponse.amount).should.be.equal(chargeData.amount);
                (paymentResponse.email).should.be.equal(user.email);

                done();
            });
    });

    it('should get user all payment', async () => {
        let url = `${BASE_URL}`;
        const res = await chai.request(server)
            .get(url)
            .set('authorization', userToken)

        chai.expect(res.body.length).to.be.greaterThan(0)
        chai.expect(res.status).to.be.equal(status.OK)
    });


    it('should be able to save a card', async () => {
        const url = `${BASE_URL}/saveCard`;
        const token = await stripe.tokens.create({ card: newCard });
        newCardId = token.card.id
        const chargeData = {
            'token': token,
            'email': CUSTOMER_DETAILS.email,
        };
        const res = await chai.request(server)
            .post(url)
            .set('authorization', userToken)
            .send({ chargeData })
        
        chai.expect(res.body.cardTokens).to.include(token.card.id)
        chai.expect(res.status).to.be.equal(status.OK)
    });

    it('should be able to delete a saved card', async () => {
        const url = `${BASE_URL}/deleteCard`;
        const chargeData = {
            source: newCardId
        };
        
        const res = await chai.request(server)
            .post(url)
            .set('authorization', userToken)
            .send({ chargeData })
        chai.expect(res.body.cardTokens).to.not.include(token.card.id)
        chai.expect(res.status).to.be.equal(status.OK)
    });

    it('should save card while making payment', async () => {
        const token = await stripe.tokens.create({ card: CUSTOMER_DETAILS.card });
        let url = `${BASE_URL}/charge/create`;
        const chargeData = {
            'currency': 'usd',
            'amount': 2000,
            'token': token,
            'email': CUSTOMER_DETAILS.email,
            'saveThisCard': true
        };
        const res = await chai.request(server)
        .post(url)
        .set('authorization', userToken)
        .send({ chargeData })
        
        const user = await User.findOne({ email: res.body.email })
        chai.expect(user.cardTokens).to.include(token.card.id)
        chai.expect(res.status).to.be.equal(status.OK)
    });
});


describe('GET /getSavedCard', function(done) {

    before(async function() {
        stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        token = await stripe.tokens.create({ card: CUSTOMER_DETAILS.card });
        customer = await stripe.customers.create({ source: token.id, email: user.email });
        CUSTOMER_DETAILS.stripeCustomerId = customer.id;
        await User.updateOne({ 'email': user.email }, { stripeCustomerId: customer.id });

    });

    it('should get all saved card', function(done) {

        let url = `${BASE_URL}/getSavedCard`;
        chai.request(server)
            .get(url)
            .set('authorization', userToken)
            .send()
            .end(function(err, res) {
                res.should.have.status(200);
                res.should.be.json;
                (res.body.length).should.be.equal(1);
                done();
            });
    });

    after(async function() {
        const result = await stripe.customers.del(`${CUSTOMER_DETAILS.stripeCustomerId}`);
        await User.update({ 'email': user.email }, { $unset: { stripeCustomerId: "" } })
        expect(result.deleted).to.be.true;
    });


});

describe("POST /refunds/create", () => {
    let REFUND_URL = "/api/admin"
    let url_ref = `${REFUND_URL}/payments/refund/create`;

    before(async function() {
       const payment = await Payment.findOne({ email: user.email })
       paymentId = payment._id
       chargeId = payment.chargeId
    });

    it("should process partial refund", async () => {
        let refundData = {
            amount: 10,
            charge,
            reason: 'requested_by_customer',
            _id: paymentId
        }

        const res = await chai.request(server)
            .post(url_ref)
            .set('Authorization', userToken)
            .send({ refundData })

        chai.expect(res.body.data.status).to.be.equals('succeeded')
        chai.expect(res.body.data.reason).to.be.equals('requested_by_customer')
        chai.expect(res.body.data.amount).to.be.equal(1000)
    })

    it("should not process refund for amount greater than unrefunded amount", async () => {
        let refundData = {
            amount: 15,
            charge,
            reason: 'requested_by_customer',
            _id: paymentId
        }

        const err = await chai.request(server)
            .post(url_ref)
            .set('Authorization', userToken)
            .send({ refundData })

        chai.expect(err.body.message).to.be.equals('Refund amount ($15.00) is greater than unrefunded amount on charge ($10.00)')
        chai.expect(err.body.code).to.be.equal(status.BAD_REQUEST)
    })

    it("should process refund for unrefunded amount", async () => {
        let refundData = {
            amount: 10,
            charge,
            reason: 'requested_by_customer',
            _id: paymentId
        }

        const res = await chai.request(server)
            .post(url_ref)
            .set('Authorization', userToken)
            .send({ refundData })

        chai.expect(res.body.data.status).to.be.equals('succeeded')
        chai.expect(res.body.data.reason).to.be.equals('requested_by_customer')
        chai.expect(res.body.data.amount).to.be.equal(1000)
    })

    it("should not process refund for refunded charge", async () => {
        let refundData = {
            amount: 10,
            charge,
            reason: 'requested_by_customer',
            _id: paymentId
        }

        const err = await chai.request(server)
            .post(url_ref)
            .set('Authorization', userToken)
            .send({ refundData })

        chai.expect(err.body.message).to.be.equals(`Charge ${chargeId} has already been refunded.`)
        chai.expect(err.body.code).to.be.equal(status.BAD_REQUEST)
    })

    it("should process refund for fresh payment", async () => {
        const paymentData = await Payment.findOne({ _id: freshPaymentId })
        let refundData = {
            amount: 20,
            reason: 'requested_by_customer',
            _id: paymentData._id
        }

        const res = await chai.request(server)
            .post(url_ref)
            .set('Authorization', userToken)
            .send({ refundData })

        chai.expect(res.body.data.status).to.be.equals('succeeded')
        chai.expect(res.body.data.reason).to.be.equals('requested_by_customer')
        chai.expect(res.body.data.amount).to.be.equal(2000)
    })

    after(async function() {
        const collections = await mongoose.connection.db.collections()
        for (let collection of collections) {
            await collection.deleteMany({});
        }
    });

})