const chai = require('chai');
const chaiHttp = require('chai-http')
const app = require('../server/app');

const expect = chai.expect;
chai.use(chaiHttp);

describe('API', function() {
    it('should return status 200 on GET requests', function() {
        return chai.request(app)
            .get('/api/jsjsjsl')
            .then(function(res) {
                expect(res).to.have.status(200);
            });
    });
})