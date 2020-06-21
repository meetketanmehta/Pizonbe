'use strict';

require('dotenv').config({path: '/Users/meetmehta/Documents/serverless/product-management/test.env'});
const ResponseGenerator = require('../../../../src/utils/response-generator');
const DBConnector = require('../../../../src/utils/db-connector');
const Category = require('../../models/Category');
const Factory = require('../factory');
const lambdaWrapper = require('serverless-mocha-plugin').lambdaWrapper;
const sinon = require('sinon');
const expect = require('chai').expect;

describe('Tests for get Category function', function () {
    let wrapped;
    let stubConnectToDB;
    let stubCategoryFind;
    let stubCategoryInsertMany;
    let CategoryManager;

    beforeEach(function () {
        stubConnectToDB = sinon.stub(DBConnector, 'connectToDatabase');
        stubCategoryFind = sinon.stub(Category, 'find');
        stubCategoryInsertMany = sinon.stub(Category, 'insertMany');
        CategoryManager = require('../../functions/category-manager');
        wrapped = lambdaWrapper.wrap(CategoryManager, {handler: 'getCategories'});
    });

    afterEach(function () {
        stubConnectToDB.restore();
        stubCategoryFind.restore();
        stubCategoryInsertMany.restore();
    });

    it('Returns categories', async function () {
        const expectedCategory = Factory.categories();
        stubCategoryFind.withArgs({}).returns(expectedCategory);

        const response = await wrapped.run({});

        sinon.assert.calledOnce(stubConnectToDB);
        sinon.assert.calledOnce(stubCategoryFind);

        expect(response).to.be.eql(ResponseGenerator.getResponseWithObject(200, expectedCategory));
    });
});

describe('Tests for getSubCategory function', function () {
    let wrapped;
    let stubConnectToDB;
    let stubCategoryFind;
    let stubCategoryInsertMany;
    let CategoryManager;

    beforeEach(function () {
        stubConnectToDB = sinon.stub(DBConnector, 'connectToDatabase');
        stubCategoryFind = sinon.stub(Category, 'find');
        stubCategoryInsertMany = sinon.stub(Category, 'insertMany');
        CategoryManager = require('../../functions/category-manager');
        wrapped = lambdaWrapper.wrap(CategoryManager, {handler: 'getSubCategories'});
    });

    afterEach(function () {
        stubConnectToDB.restore();
        stubCategoryFind.restore();
        stubCategoryInsertMany.restore();
    });

    it('Returns subCategories', async function () {
        const expectCategories = Factory.categories();
        stubCategoryFind.withArgs({}).returns(expectCategories);

        const response = await wrapped.run({});

        sinon.assert.calledOnce(stubConnectToDB);
        sinon.assert.calledOnce(stubCategoryFind);

        expect(response).to.be.eql(ResponseGenerator.getResponseWithObject(200, expectCategories));
    });

    it('Returns only subCategories of given Category', async function () {
        const expectedCategories = Factory.categories();
        stubCategoryFind.withArgs({
            category: expectedCategories[0].category
        }).returns(expectedCategories);

        const event = {
            queryStringParameters: {
                category: expectedCategories[0].category
            }
        };

        const response = await wrapped.run(event);

        sinon.assert.calledOnce(stubConnectToDB);
        sinon.assert.calledOnce(stubCategoryFind);

        expect(response).to.be.eql(ResponseGenerator.getResponseWithObject(200, expectedCategories));
    });
});