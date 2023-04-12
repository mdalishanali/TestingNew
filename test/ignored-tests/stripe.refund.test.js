const chai = require("chai")
const chaiHttp = require('chai-http')

chai.use(chaiHttp)

describe("testing the refund api", () => {
    let _id = "61b5af326144d623c8da0c5e"
    let adminToken = "" //admin jwt token
    let host = "http://localhost:8000/api/admin/payments"

    it("should process the refund", (done) => {
        let refundData = {
            amount: 1,
            _id,
            reason: 'requested_by_customer'
        }
        chai.request(host)
            .post('/refund/create')
            .set('Authorization', adminToken)
            .send({ refundData })
            .end(function(error, res) {
                if (error) {
                    done(error);
                } else {
                    chai.expect(res.body.data.status).to.be.equals('succeeded')
                    done();
                }
            });
    })
})