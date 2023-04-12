require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = require('assert');
const status = require('http-status');
const mongoose = require('mongoose');
const admin = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth')
const server = require('../server/lib/index');
const { User } = require('../server/lib/db');
const utils = require('./utils');

//Firease admin initialization
testingAdmin = admin.initializeApp({
    credential: admin.cert({
        "type": process.env.FIREBASE_ADMIN_TYPE,
        "project_id": process.env.FIREBASE_ADMIN_PROJECT_ID,
        "private_key_id": process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
        "private_key": process.env.FIREBASE_ADMIN_PRIVATE_KEY,
        "client_email": process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        "client_id": process.env.FIREBASE_ADMIN_CLIENT_ID,
        "auth_uri": process.env.FIREBASE_ADMIN_AUTH_URI,
        "token_uri": process.env.FIREBASE_ADMIN_TOKEN_URI,
        "auth_provider_x509_cert_url": process.env.FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL,
        "client_x509_cert_url": process.env.FIREBASE_ADMIN_CLIENT_X509_CERT_URL
    })
}, 'tesing');

const adminAuth = getAuth(testingAdmin)

// Constants
const dbURI = process.env.DB_PATH;
const DATA_PATH = `test/data/auth.yml`;
const DOMAIN_BASE = `http://localhost:8000/`;
const AUTH_PATH = `/api/auth/register`;
chai.use(chaiHttp);

const getRandomEmail = () => {
    var chars = 'abcdefghijklmnopqrstuvwxyz1234567890';
    var string = '';
    for(var ii=0; ii<15; ii++){
        string += chars[Math.floor(Math.random() * chars.length)];
    }
    const email = string + '@gmail.com'
    return email
}

describe('Authentication', () => {
    describe('/POST register', () => {

        beforeEach(async function() {
            await utils.seedDatabase(dbURI, DATA_PATH, null);
        });

        afterEach(async function() {
            const collections = await mongoose.connection.db.collections()

            for (let collection of collections) {
                const res = await collection.deleteMany({});
            }
        });

        it('it should register', async() => {
            const user = {
                name: {
                    first: 'User',
                    last: 'one'
                },
                email: 'user@one.com',
                password: 'Strong@Password1234'
            }

            const res = await chai.request(server)
                .post(AUTH_PATH)
                .send({ user })

            assert.ok(res.status, status.OK);
            const newUser = await User.findOne({ email: user.email });

            assert.equal(newUser.name.first, user.name.first);
            assert.equal(newUser.name.last, user.name.last);
            assert.equal(newUser.email, user.email);

            await adminAuth.deleteUser(newUser.firebaseUid)
        });


        it('throws an error if email is missing', async() => {
            const user = {
                name: {
                    first: 'User',
                    last: 'one'
                },
                password: 'Let\'s go!'
            };
            const error = await chai.request(server)
                .post(AUTH_PATH)
                .send({ user })

            assert.equal(error.status, status.UNPROCESSABLE_ENTITY);
            assert.equal(error.body.message, 'Email is required')
        });

        it('throws an error if password is missing', async() => {
            const user = {
                name: {
                    first: 'User',
                    last: 'one'
                },
                email: 'user@one.com'
            };
            const error = await chai.request(server)
                .post(AUTH_PATH)
                .send({ user })

            assert.equal(error.status, status.UNPROCESSABLE_ENTITY);
            assert.equal(error.body.message, 'Password is required')
        });

        it('throws an error if password is weak', async() => {
            const user = {
                name: {
                    first: 'User',
                    last: 'one'
                },
                email: 'test@four.com',
                password: 'weak password'
            };
            const error = await chai.request(server)
                .post(AUTH_PATH)
                .send({ user })

            assert.equal(error.status, status.UNPROCESSABLE_ENTITY);
            assert.equal(error.body.message, 'Password must contain at least 8 characters, including upper and lowercase characters, a number and a special character.')
        });

        it('throws an error if the email id already exists', async() => {
            const user = {
                name: {
                    first: 'User',
                    last: 'one'
                },
                email: 'test@one.com',
                password: 'It will@fail!1234'
            };

            const error = await chai.request(server)
                .post(AUTH_PATH)
                .send({ user });

            assert.equal(error.status, status.CONFLICT);
            assert.equal(error.body.message, 'Email already in use')
        });

        it('should register and login with OAuth', async() => {
            const OAUTH_PATH = `/api/auth/registerLoginOauth`;
            const randomEmail = getRandomEmail()
            const user = {
                name: {
                    first: 'User',
                    last: 'one'
                },
                email: randomEmail,
                accessToken: 'this is a test token and backend should accept it in testing environment',
                firebaseUid: 'sjfljasjdglkjalsdg'
            };

            const response = await chai.request(server)
                .post(OAUTH_PATH)
                .send({ user });
            chai.expect(response.status).to.be.equals(status.OK)
            chai.expect(response.body.message).to.be.equals('Registered Successfully')

            const loginUser = {
                email: randomEmail,
                accessToken: 'this is a test token and backend should accept it in testing environment',
                firebaseUid: 'sjfljasjdglkjalsdg'
            };

            const loinResponse = await chai.request(server)
                .post(OAUTH_PATH)
                .send({ user: loginUser });
            chai.expect(loinResponse.status).to.be.equals(status.OK)
            chai.expect(loinResponse.body.message).to.be.equals('Logged In')

        });

        it('should login with OAuth for existing email pass user', async() => {
            const OAUTH_PATH = `/api/auth/registerLoginOauth`;
            const user = {
                email: 'test@three.com',
                accessToken: 'this is a test token and backend should accept it in testing environment',
            };

            const response = await chai.request(server)
                .post(OAUTH_PATH)
                .send({ user });
            chai.expect(response.status).to.be.equals(status.OK)
            chai.expect(response.body.message).to.be.equals('Logged In')
        });
    });
});