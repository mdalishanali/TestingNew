const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require("mongoose");
const MessageService = require("../../server/lib/services/message");
const server = require('../../server/lib/index');
const {
    db
} = require('../../server/lib/db');

const should = chai.should();
chai.use(chaiHttp);


describe('Services Tests', function() {
    const messageservice = new MessageService.MessageService();
    describe('Valid Number', () => {
        it('should return true', (done) => {
            const result = messageservice.validE164('+919592684598');
            (result).should.be.equal(true);
            done()
        });
    });

    describe('Invalid Number', () => {
        it('should return false', (done) => {
            const result = messageservice.validE164('9592684598s');
            (result).should.be.equal(false);
            done()
        });
    });

    describe('Message Sent', () => {

        it('should return accountSid', (done) => {
            messageservice.sendMessages('+917986426776', 'Sample Message')
                .then((message) => {
                    (message.accountSid).should.be.equal('ACe95d46dbf61b23a56f2d7dc684e850da')
                    done()
                })
                .catch((err) => {
                    done(err)
                })

        });
    });
});