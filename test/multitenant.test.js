require("mocha");
const chai = require("chai");
const chaiHttp = require("chai-http");
const status = require("http-status");
const mongoose = require("mongoose");
const server = require("../server/lib/index");
const { User, InvitedUsers } = require("../server/lib/db");
const jwt = require('jsonwebtoken');
chai.use(chaiHttp);

const getRandomEmail = () => {
  var chars = "abcdefghijklmnopqrstuvwxyz1234567890";
  var string = "";
  for (var ii = 0; ii < 15; ii++) {
    string += chars[Math.floor(Math.random() * chars.length)];
  }
  const email = string + "@gmail.com";
  return email;
};

const getInvitedToken = (email) => {
    const token = jwt.sign({ exp: Math.floor(Date.now() / 1000) + (60 * 60), email: email }, 'i am a tea pot');
    return token
}

const ADMIN_INVITE_PATH = "/api/admin/inviteUser";
const INVITE_PATH_USER = "/api/inviteUser";
const ACCEPT_INVITE_PATH = "/api/accept-invite";
const AUTH_PATH = `/api/auth/register`;
const ADMIN_COMPANY_PATH = "/api/admin/company";
const inviterEmail = getRandomEmail();
let inviterToken = "";
const invitedEmail = getRandomEmail();
let invitedEmailToken = "";
const invitedEmailInviteToken = getInvitedToken(invitedEmail)
let invitedEmailCompanyId = ""
const invitedEmail2 = getRandomEmail();
let invitedEmail2Token = "";
const invitedEmail3 = getRandomEmail();
const invitedEmail3InviteToken = getInvitedToken(invitedEmail3)
const invitedEmail4 = getRandomEmail();
const invitedEmail4InviteToken = getInvitedToken(invitedEmail4)
let invitedEmail4Token = "";
const invitedEmail5 = getRandomEmail();

// super admin constants
const superAdminEmail = getRandomEmail();
let superAdminEmailToken = "";
const company1Person1Email = getRandomEmail();


describe("Multitenant User System", () => {
  describe("Send Invitation", () => {
    it("Company admin should be able to register", async () => {
      const user = {
        name: {
          first: "Your",
          last: "Name",
        },
        email: inviterEmail,
        password: "Strong@Password1234",
      };

      const res = await chai.request(server).post(AUTH_PATH).send({ user });
      inviterToken = res.body.token;
      chai.expect(res.status).to.be.equal(status.OK);
      const newUser = await User.findOne({ email: user.email });
      chai.expect(newUser.name.first).to.be.equals(user.name.first);
      chai.expect(newUser.name.last).to.be.equals(user.name.last);
    });

    it("Company admin should be able to invite user as moderator", async () => {
      const emails = [{ email: invitedEmail, role: 'Moderator' }];
      const url = `${INVITE_PATH_USER}/invite`;

      const res = await chai
        .request(server)
        .post(url)
        .set("Authorization", inviterToken)
        .send({ document: { emails } });

      chai
        .expect(res.body.data.message)
        .to.be.equals("Mail with invite sent successfully ");
      chai.expect(res.status).to.be.equal(status.OK);
    });

    it("Company admin should be able to invite user as admin", async () => {
      const emails = [{ email: invitedEmail4, role: 'Admin' }];
      const url = `${INVITE_PATH_USER}/invite`;

      const res = await chai
        .request(server)
        .post(url)
        .set("Authorization", inviterToken)
        .send({ document: { emails } });

      chai
        .expect(res.body.data.message)
        .to.be.equals("Mail with invite sent successfully ");
      chai.expect(res.status).to.be.equal(status.OK);
    });

    it("Company admin should be able to cancel sent invite", async () => {
      const invite = await InvitedUsers.findOne({ invitedEmail: invitedEmail4 })
      const url = `${INVITE_PATH_USER}/cancelInvite/${invite._id}`;

      const res = await chai
        .request(server)
        .get(url)
        .set("Authorization", inviterToken)

      chai
        .expect(res.body.data.message)
        .to.be.equals("Invitation cancelled successfully");
      chai.expect(res.status).to.be.equal(status.OK);
    });

    it("Company admin should be able to re-send invitation", async () => {
      const email = invitedEmail;
      const url = `${INVITE_PATH_USER}/resend-invite`;

      const res = await chai
        .request(server)
        .post(url)
        .set("Authorization", inviterToken)
        .send({ document: { email } });

      chai
        .expect(res.body.data.message)
        .to.be.equals(
          `Invitation email re-sent successfully to ${invitedEmail}`
        );
      chai.expect(res.status).to.be.equal(status.OK);
    });

    it("Company admin should be able to invite multiple users at once", async () => {
      const emails = [{ email: invitedEmail2, role: 'Moderator' }, { email: invitedEmail3, role: 'Moderator' }];
      const url = `${INVITE_PATH_USER}/invite`;

      const res = await chai
        .request(server)
        .post(url)
        .set("Authorization", inviterToken)
        .send({ document: { emails } });

      chai
        .expect(res.body.data.message)
        .to.be.equals("Mail with invite sent successfully ");
      chai.expect(res.status).to.be.equal(status.OK);
    });

    it("Company admin should not be able to invite invited users", async () => {
        const emails = [{ email: invitedEmail, role: 'Moderator' }];
        const url = `${INVITE_PATH_USER}/invite`;
  
        const res = await chai
          .request(server)
          .post(url)
          .set("Authorization", inviterToken)
          .send({ document: { emails } });
  
        chai
          .expect(res.body.data.message)
          .to.be.equals(`Mail with invite sent successfully except for ${invitedEmail} as they are already invited`);
        chai.expect(res.status).to.be.equal(status.OK);
      });
  });

  describe('Accept Invitation', () => {

    it("Invited user should be able to register", async () => {
        const user = {
          name: {
            first: "Your",
            last: "Name",
          },
          email: invitedEmail,
          password: "Strong@Password1234",
        };
  
        const res = await chai.request(server).post(AUTH_PATH).send({ user });
        invitedEmailToken = res.body.token;
        chai.expect(res.status).to.be.equal(status.OK);
        const newUser = await User.findOne({ email: user.email });
        chai.expect(newUser.name.first).to.be.equals(user.name.first);
        chai.expect(newUser.name.last).to.be.equals(user.name.last);
    });

    it("Invited user should be able to accept invite automatically", async () => {
        const url = `${ACCEPT_INVITE_PATH}/accept-invite/${invitedEmailInviteToken}`;
        const res = await chai
          .request(server)
          .get(url)
          .set("Authorization", invitedEmailToken)

          chai
          .expect(res.body.data.message)
          .to.be.equals(
            `Invitation accepted successfully`
          );
        chai.expect(res.status).to.be.equal(status.OK);
    });

    it("Invited user should not be able to accept invite twice", async () => {
        const url = `${ACCEPT_INVITE_PATH}/accept-invite/${invitedEmailInviteToken}`;
        const res = await chai
          .request(server)
          .get(url)
          .set("Authorization", invitedEmailToken)

          chai
          .expect(res.body.message)
          .to.be.equals(
            `You have accepted one invitation already`
          );
        chai.expect(res.status).to.be.equal(status.UNPROCESSABLE_ENTITY);
        
    });

    it("User should not accept different user invitaion", async () => {

        const user = {
            name: {
              first: "Your",
              last: "Name",
            },
            email: invitedEmail2,
            password: "Strong@Password1234",
          };
    
          const resRegister = await chai.request(server).post(AUTH_PATH).send({ user });
          invitedEmail2Token = resRegister.body.token;
          chai.expect(resRegister.status).to.be.equal(status.OK);
          const newUser = await User.findOne({ email: user.email });
          chai.expect(newUser.name.first).to.be.equals(user.name.first);
          chai.expect(newUser.name.last).to.be.equals(user.name.last);

        const url = `${ACCEPT_INVITE_PATH}/accept-invite/${invitedEmail3InviteToken}`;
        const res = await chai
          .request(server)
          .get(url)
          .set("Authorization", invitedEmail2Token)

          chai
          .expect(res.body.message)
          .to.be.equals(
            `this invitation does not belong to '${invitedEmail2}'.`
          );
        chai.expect(res.status).to.be.equal(status.UNPROCESSABLE_ENTITY);
        
    });

    it("User should not be able to accept cancelled invite ", async () => {

      const user = {
          name: {
            first: "Your",
            last: "Name",
          },
          email: invitedEmail4,
          password: "Strong@Password1234",
        };
  
        const resRegister = await chai.request(server).post(AUTH_PATH).send({ user });
        invitedEmail4Token = resRegister.body.token;
        chai.expect(resRegister.status).to.be.equal(status.OK);
        const newUser = await User.findOne({ email: user.email });
        chai.expect(newUser.name.first).to.be.equals(user.name.first);
        chai.expect(newUser.name.last).to.be.equals(user.name.last);

      const url = `${ACCEPT_INVITE_PATH}/accept-invite/${invitedEmail4InviteToken}`;
      const res = await chai
        .request(server)
        .get(url)
        .set("Authorization", invitedEmail4Token)

        chai
        .expect(res.body.message)
        .to.be.equals(
          `Invitation is cancelled`
        );
      chai.expect(res.status).to.be.equal(status.UNPROCESSABLE_ENTITY);
      
  });
  })

  describe("Send Invitation Route Protection", () => {
    it("Moderator should not be able invite invite users to their company", async () => {
      const emails = [{ email: invitedEmail, role: 'Moderator' }];
      const url = `${INVITE_PATH_USER}/invite`;

      const err = await chai
        .request(server)
        .post(url)
        .set("Authorization", invitedEmailToken)
        .send({ document: { emails } });

      chai
        .expect(err.body.message)
        .to.be.equals(
          `Admin authorization required`
        );
      chai.expect(err.status).to.be.equal(status.FORBIDDEN);
    });

    it("Moderator should not be able invite invite users as super admin", async () => {

      const userData = await chai
      .request(server)
      .get('/api/user/me')
      .set("Authorization", invitedEmailToken)

      invitedEmailCompanyId = userData.body.companyId._id

      const emails = [{ email: invitedEmail, role: 'Moderator' }];
      const url = `${ADMIN_COMPANY_PATH}/invite/${invitedEmailCompanyId}`;

      const err = await chai
        .request(server)
        .post(url)
        .set("Authorization", invitedEmailToken)
        .send({ document: { emails } });

      chai
        .expect(err.body.message)
        .to.be.equals(
          `Super Admin authorization required`
        );
      chai.expect(err.status).to.be.equal(status.FORBIDDEN);
    });

    it("Comapny admins should not be able invite invite users as super admin", async () => {
      const emails = [{ email: invitedEmail, role: 'Moderator' }];
      const url = `${ADMIN_COMPANY_PATH}/invite/${invitedEmailCompanyId}`;

      const err = await chai
        .request(server)
        .post(url)
        .set("Authorization", inviterToken)
        .send({ document: { emails } });

      chai
        .expect(err.body.message)
        .to.be.equals(
          `Super Admin authorization required`
        );
      chai.expect(err.status).to.be.equal(status.FORBIDDEN);
    });

    
  })

  describe('Send Invitation by Super Admin', () => {
    it("Creating a Super Admin", async () => {
      const user = {
        name: {
          first: "Super",
          last: "Admin",
        },
        email: superAdminEmail,
        password: "Strong@Password1234",
      };
      const res = await chai.request(server).post(AUTH_PATH).send({ user });
      superAdminEmailToken = res.body.token;
      await User.updateOne({ email: superAdminEmail }, { $set: { roles: 'Super Admin' } }, { new: true })
      const superAdmin = await User.findOne({ email: superAdminEmail })
      chai
        .expect(superAdmin.roles)
        .to.be.equals("Super Admin");
    })

    it("Super admin should be able to invite company admins", async () => {
      const emails = [{ email: company1Person1Email, role: 'Admin' }];
      const url = `${ADMIN_INVITE_PATH}/invite`;

      const res = await chai
        .request(server)
        .post(url)
        .set("Authorization", superAdminEmailToken)
        .send({ document: { emails } });
      chai
        .expect(res.body.data.message)
        .to.be.equals("Mail with invite sent successfully ");
      chai.expect(res.status).to.be.equal(status.OK);
    });

    it("Super admin should not be able to invite invited users", async () => {
      const emails = [{ email: company1Person1Email, role: 'Admin' }];
      const url = `${ADMIN_INVITE_PATH}/invite`;

      const res = await chai
        .request(server)
        .post(url)
        .set("Authorization", superAdminEmailToken)
        .send({ document: { emails } });

      chai
        .expect(res.body.data.message)
        .to.be.equals(`Mail with invite sent successfully except for ${company1Person1Email} as they are already invited`);
      chai.expect(res.status).to.be.equal(status.OK);
    });

    it("Super admin should be able to cancel sent invite", async () => {
      const invite = await InvitedUsers.findOne({ invitedEmail: company1Person1Email })
      const url = `${ADMIN_INVITE_PATH}/cancelInvite/${invite._id}`;

      const res = await chai
        .request(server)
        .get(url)
        .set("Authorization", superAdminEmailToken)

      chai
        .expect(res.body.data.message)
        .to.be.equals("Invitation cancelled successfully");
      chai.expect(res.status).to.be.equal(status.OK);
    });

    it("Super admin should be able invite invite users on behalf of a company", async () => {

      const emails = [{ email: invitedEmail5, role: 'Moderator' }];
      const url = `${ADMIN_COMPANY_PATH}/invite/${invitedEmailCompanyId}`;

      const res = await chai
        .request(server)
        .post(url)
        .set("Authorization", superAdminEmailToken)
        .send({ document: { emails } });

      chai
        .expect(res.body.data.message)
        .to.be.equals("Mail with invite sent successfully ");
      chai.expect(res.status).to.be.equal(status.OK);
    });

    it("Super admin should be able to cancel sent invite on behalf of a company", async () => {
      const invite = await InvitedUsers.findOne({ invitedEmail: invitedEmail5 })
      const url = `${ADMIN_COMPANY_PATH}/cancelInvite/${invitedEmailCompanyId}`;

      const res = await chai
        .request(server)
        .put(url)
        .set("Authorization", superAdminEmailToken)
        .send({ update: { _id: invite._id } });

      chai
        .expect(res.body.data.message)
        .to.be.equals("Invitation cancelled successfully");
      chai.expect(res.status).to.be.equal(status.OK);
    });

    after ( async function (){
      const collections = await mongoose.connection.db.collections();
      for (let collection of collections) {
        await collection.deleteMany({});
      }
    })
  })
});
