require('dotenv').config({path: '/Users/meetmehta/Documents/serverless/product-management/test.env'});
//const ProductManager = require('../../functions/product-manager');
const expect = require('chai').expect;
const sinon = require('sinon');
const lambdaWrapper = require('serverless-mocha-plugin').lambdaWrapper;
const Product = require('../../models/Product');
const ResponseGenerator = require('../../../../src/utils/response-generator');
const DBConnector = require('../../../../src/utils/db-connector');
const factory = require('../factory');

describe('Tests for get Brands function', function () {
    let ProductManager;
    let wrapped;
    let stubConnectToDB;
    let stubProductFind;

    const BRAND1 = "Test Brand1";
    const BRAND2 = "Test Brand2";

    const CATEGORY1 = "Test Category";
    const SUB_CATEGORY1 = "Test SubCategory";

    const expectedBrands = [BRAND1, BRAND2];

    beforeEach(function () {
        stubConnectToDB = sinon.stub(DBConnector, 'connectToDatabase');
        stubProductFind = sinon.stub(Product, 'find');
        ProductManager = require('../../functions/product-manager');
        wrapped = lambdaWrapper.wrap(ProductManager, {handler: 'getBrands'});
    });

    afterEach(function () {
        stubConnectToDB.restore();
        stubProductFind.restore();
    })

    it('Returns 404 if no brands found', async function () {
        const event = {
            headers: factory.customerToken()
        };

        const response = await wrapped.run(event);

        sinon.assert.calledOnce(stubConnectToDB);
        sinon.assert.calledOnce(stubProductFind);

        expect(response).to.be.eql(ResponseGenerator.getResponseWithObject(404, []));
    })

    it('Test without any queryParameter', async function () {
        const event = {
            headers: factory.customerToken()
        };
        stubProductFind.withArgs({}).returns(factory.products({brand: [BRAND1, BRAND2, BRAND1]}));

        const response = await wrapped.run(event);
        sinon.assert.calledOnce(stubConnectToDB);
        sinon.assert.calledOnce(stubProductFind);

        expect(response).to.be.eql(ResponseGenerator.getResponseWithObject(200, expectedBrands));
    });

    it('Test with category as query Parameter', async function () {
        const event = {
            headers: factory.customerToken(),
            queryStringParameters: {
                category: CATEGORY1
            }
        };

        stubProductFind.withArgs({
            category: CATEGORY1
        }).returns(factory.products({brand: [BRAND1, BRAND2]}));

        const response = await wrapped.run(event);

        sinon.assert.calledOnce(stubConnectToDB);
        sinon.assert.calledOnce(stubProductFind);

        expect(response).to.be.eql(ResponseGenerator.getResponseWithObject(200, expectedBrands));
    });

    it('Test with category and sub category as query Parameter', async function () {
        const event = {
            headers: factory.customerToken(),
            queryStringParameters: {
                category: CATEGORY1,
                subCategory: SUB_CATEGORY1
            }
        };

        stubProductFind.withArgs({
            category: CATEGORY1,
            subCategory: SUB_CATEGORY1
        }).returns(factory.products({brand:[BRAND1, BRAND2]}));

        const response = await wrapped.run(event);

        sinon.assert.calledOnce(stubConnectToDB);
        sinon.assert.calledOnce(stubProductFind);

        expect(response).to.be.eql(ResponseGenerator.getResponseWithObject(200, expectedBrands));
    });
});

describe("Test for getNearby Products", function () {
    import * as ProductManager from '../../functions/product-manager';
    let wrapped = lambdaWrapper.wrap(ProductManager, {handler: 'getNearbyProducts'});

    it("Test 1", async function () {
        await wrapped.run({});
    });
});