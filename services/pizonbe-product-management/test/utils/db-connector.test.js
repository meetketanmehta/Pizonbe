const mongoose = require('mongoose');
const sinon = require('sinon');
require('dotenv').config({path: '/Users/meetmehta/Documents/serverless/product-management/test.env'});

describe('Tests for db-connector', function() {
    let DBConnector;
    let mongooseSinon;

    beforeEach(function () {
        mongooseSinon = sinon.stub(mongoose, 'connect');
        DBConnector = require('../../../../src/utils/db-connector');
    });

    it('Should create connection only once', async function () {
        await DBConnector.connectToDatabase();
        await DBConnector.connectToDatabase();
        sinon.assert.calledOnce(mongooseSinon);
    });
});