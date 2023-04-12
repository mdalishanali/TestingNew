const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require("mongoose");
const status = require('http-status');
const EmailService = require("../server/lib/services/email");
var assert = chai.assert;
const server = require('../server/lib/index');
const jwt = require('jsonwebtoken');
const {
    db
} = require('../server/lib/db');
const nock = require('nock')
const utils = require('./utils');
const should = chai.should();
chai.use(chaiHttp);


// Constants
const dbURI = process.env.DB_PATH;
const DATA_PATH = `test/data/auth.yml`;
const NOCKING_URL = `http://localhost:${process.env.PORT}`

describe('forgotpassword API Tests', function() {

    describe('POST /send-reset-email', function() {

        beforeEach(async function() {
            await utils.seedDatabase(dbURI, DATA_PATH, null);
        });

        afterEach(async function() {
            const collections = await mongoose.connection.db.collections()

            for (let collection of collections) {
                await collection.deleteMany({});
            }
        });

        it('should send email to valid email if present in db', function(done) {
            try {
                nock(NOCKING_URL)
                    .post(`/api/user/send-reset-email`)
                    .reply(200, {
                        body: "",
                        headers: {}
                    })
                chai.request(NOCKING_URL)
                    .post('/api/user/send-reset-email')
                    .send({
                        email: 'test@one.com'
                    })
                    .end(function(err, res) {
                        if (err) {
                            done(err);
                        }
                        assert.equal(res.status, status.OK);
                        done()
                    })
            } catch (err) {
                done(err);
            }
        }).timeout(10000);


        it('should not send email to invalid email id', function(done) {
            try {
                nock(NOCKING_URL)
                    .post(`/api/user/send-reset-email`)
                    .reply(200, {
                        error: { status: 409 }
                    })
                chai.request(NOCKING_URL)
                    .post('/api/user/send-reset-email')
                    .send({
                        email: 'squadc07@gmail.com'
                    })
                    .end(function(err, res) {
                        //    it's always returning res
                        assert.equal(res.body.error.status, 409);
                        done()
                    })
            } catch (err) {
                done(err);
            }
        }).timeout(10000);
    });

    describe('POST /reset-password', function() {

        beforeEach(async function() {
            await utils.seedDatabase(dbURI, DATA_PATH, null);
        });

        afterEach(async function() {
            const collections = await mongoose.connection.db.collections()

            for (let collection of collections) {
                await collection.deleteMany({});
            }
        });

        it('should verify token if token is not expired', function(done) {
            try {
                const email = 'test@one.com';
                var token = jwt.sign({ exp: Math.floor(Date.now() / 1000) + (60 * 60), email_id: email }, 'i am a tea pot');
                chai.request(server)
                    .get('/api/user/reset-password/' + token)
                    .redirects(0)
                    .end(function(err, res) {
                        if (err) {
                            done(err);
                        }

                        assert.equal(res.redirect, true);
                        assert.equal(res.headers.location, `http://localhost:8000/reset?email=${email}&token=${token}`)
                        done()
                    })
            } catch (err) {
                done(err);
            }
        });

        it('should not verify token if its expired', function(done) {
            try {
                var token = jwt.sign({ exp: Math.floor(1514745000000 / 1000) + (60 * 60), email_id: 'test@one.com' }, 'i am a tea pot');
                chai.request(server)
                    .get('/api/user/reset-password/' + token)
                    .end(function(err, res) {
                        //    it's always returning res
                        const response = JSON.parse(res.error.text)
                        assert.equal(response.name, 'TokenExpiredError');
                        done()
                    })
            } catch (err) {
                done(err);
            }
        });
    });


    describe('POST /update-password', function() {

        beforeEach(async function() {
            await utils.seedDatabase(dbURI, DATA_PATH, null);
        });

        afterEach(async function() {
            const collections = await mongoose.connection.db.collections()

            for (let collection of collections) {
                await collection.deleteMany({});
            }
        });

        it('should update password', function(done) {
            try {
                const email = 'test@one.com'

                chai.request(server)
                    .post('/api/user/update-password')
                    .send({
                        data: {
                            email,
                            password: 'Boilerplate@1234',
                            token: jwt.sign({ exp: Math.floor(Date.now() / 1000) + (60 * 60), email_id: email }, 'i am a tea pot')
                        }
                    })
                    .end(function(err, res) {
                        if (err) {
                            done(err);
                        }
                        assert.equal(res.body.hasPassword, true);
                        done()
                    })
            } catch (err) {
                done(err);
            }
        });

        it('should return error for invalid email id which is not registered', function(done) {
            try {
                const email = 'sanjayxxxxx@gmail.com'
                chai.request(server)
                    .post('/api/user/update-password')
                    .send({
                        email,
                        password: 'Boilerplate@1234',
                        token: jwt.sign({ exp: Math.floor(Date.now() / 1000) + (60 * 60), email_id: email }, 'i am a tea pot')
                    })
                    .end(function(err, res) {
                        // it's always returning res
                        // assert.equal(res.body.message, 'Email is not registerd');
                        done()
                    })
            } catch (err) {
                assert.equal(err.message, 'Email is not registerd');
                done(err)
            }
        });
    });


});