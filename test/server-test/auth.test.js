require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = require('assert');
const status = require('http-status');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const server = require('../../server/lib/index');
const { User } = require('../../server/lib/db');
const utils = require('../utils');

// Constants
const dbURI = 'mongodb://localhost:27017/boilerplate';
const DATA_PATH = `test/data/auth.yml`;
const DOMAIN_BASE = `http://localhost:8000/api`;
const AUTH_PATH = `/api/auth/register`;

chai.use(chaiHttp);

describe('Authentication', () => {
  describe('/POST register', () => {
    beforeEach(async function () {
        await utils.seedDatabase(dbURI, DATA_PATH, null);
    });

    afterEach(async function () {
      const collections = await mongoose.connection.db.collections()

      for (let collection of collections) {
        await collection.remove()
      }
    });

    it('it should register', async() => {
      const user = {
          name: {
            first: 'User',
            last: 'one'
          },
          email: 'user@one.com',
          password: 'Let\'s go!'
      }

      const res = await chai.request(server)
        .post(AUTH_PATH)
        .send({ user })
      
      assert.ok(res.status, status.OK);
      const newUser = await User.findOne({ email: user.email });
      
      assert.equal(newUser.name.first, user.name.first);
      assert.equal(newUser.name.last, user.name.last);
      assert.equal(newUser.email, user.email);
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

    it('throws an error if the email id already exists', async() => {
      const user = {
        name: {
          first: 'User',
          last: 'one'
        },
        email: 'test@one.com',
        password: 'It will fail!'
      };

      const error = await chai.request(server)
        .post(AUTH_PATH)
        .send({ user });

        assert.equal(error.status, status.CONFLICT);
        assert.equal(error.body.message, 'Email already in use')
    });

    it('hash the password before storing into the db', async() => {
      const user = {
        name: {
          first: 'User',
          last: 'one'
        },
        email: 'user@one.com',
        password: 'Let\'s go!'
      };

      await chai.request(server)
        .post(AUTH_PATH)
        .send({ user });

      const newUser = await User.findOne({ email: user.email });
      assert.ok(bcrypt.compareSync(user.password, newUser.password));
    })
  });
});