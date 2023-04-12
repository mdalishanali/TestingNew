const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require("mongoose");
const MessageService = require("../../server/lib/services/message");
var assert = chai.assert;
const server = require('../../server/lib/index');
const {
    db
} = require('../../server/lib/db/index');

const should = chai.should();
chai.use(chaiHttp);


describe('Twilio API Tests', function() {

    describe('POST /message', function() {
        it('should send message', function(done) {
            try {
                chai.request('http://localhost:8000')
                    .post('/api/twilio/send')
                    .send({
                        number: '+917986426776',
                        message: 'Test Message!'
                    })
                    .end(function(err, res) {
                        if (err) {
                            done(err);
                        }
                        assert.equal(res.status, 200);
                        done()
                    })
            } catch (err) {
                done(err);
            }
        }).timeout(10000);
        it('should return error message (Phone number is incorrect!)', function(done) {
            try {
                chai.request('http://localhost:8000')
                    .post('/api/twilio/send')
                    .send({
                        number: '+9179864267768',
                        message: 'Test Message!'
                    })
                    .end(function(err, res) {
                        if (err) {
                            done(err);
                        }
                        assert.equal(res.body.status, '400');
                        done()
                    })
            } catch (err) {
                done(err);
            }
        }).timeout(10000);

    });


});