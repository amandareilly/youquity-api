const chai = require('chai');
const chaiHttp = require('chai-http')
const app = require('../server/app');
const mongoose = require('mongoose');

const { runServer, closeServer } = require('../server/server');
const { TEST_DATABASE_URL, TEST_PORT} = require('../server/config');

// models
const Company = require('../server/models/Company');

const { expect } = chai;
chai.use(chaiHttp);

// import dummy data
const {testCompany, testUser} = require('./testData');

let jwt;

describe('Company Endpoints', function () {
    // start server
    before(function() {
        return runServer(TEST_DATABASE_URL, TEST_PORT)
        .then(() => {
            // create and authenticate a user
            return chai.request(app)
                .post('/api/users')
                .send(testUser);
        })
        .then((res) => {
            return chai.request(app)
                .post('/api/auth/login')
                .send(testUser);
        })
        .then((res) => {
            jwt = res.body.jwt;
        });
    });

    // drop db and close server
    after(function() {
        return mongoose.connection.dropDatabase()
        .then((dropped) => {
            if(dropped) {
                return closeServer();
            } else {
                throw new Error('database not dropped');
            }
        })
    });

    describe('/api/company', function() {
        it('POST: should not add a company without a name', function(done) {
            chai.request(app)
                .post('/api/company')
                .set('Authorization', `Bearer ${jwt}`)
                .send({brokenRequest: 'Broken'})
                .then((res) => {
                    expect(res).to.have.status(400);
                    return Company.countDocuments();
                })
                .then((count) => {
                    expect(count).to.equal(0);
                    done();
                })
                .catch((err) => {
                    console.error(err);
                    done(err);
                });
        });
        it('POST: should add a new company', function(done) {
            chai.request(app)
                .post('/api/company')
                .set('Authorization', `Bearer ${jwt}`)
                .send(testCompany)
                .then((res) => {
                    expect(res).to.have.status(201);
                    expect(res.body.companyData.name).to.equal(testCompany.name);

                    return Company.findOne();
                })
                .then((company) => {
                    expect(company.name).to.equal(testCompany.name);
                    done();
                })
                .catch(err => {
                    console.error(err);
                    done(err);
                })
        });
        it('POST: should not add a second company', function(done) {
            chai.request(app)
                .post('/api/company')
                .set('Authorization', `Bearer ${jwt}`)
                .send(testCompany)
                .then((res) => {
                    expect(res).to.have.status(403);
                    return Company.countDocuments({});
                })
                .then((count) => {
                    expect(count).to.equal(1);
                    done();
                })
                .catch(err => {
                    console.error(err);
                    done(err);
                });
        });
        it('GET: should return the existing company', function(done) {
            Company
                .create(testCompany)
                .then(() => {
                    return chai.request(app)
                        .get('/api/company')
                        .set('Authorization', `Bearer ${jwt}`);
                })
                .then((res) => {
                    expect(res).to.have.status(200);
                    expect(res.body.companyData.name).to.equal(testCompany.name);
                    done();
                })
                .catch((err) => {
                    console.error(err);
                    done(err);
                });
        });
    });
});