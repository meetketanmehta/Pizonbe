'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;
const factory = require('../factory');
const ResponseGenerator = require('../../../../src/utils/response-generator');
const mochaPlugin = require('serverless-mocha-plugin');
require('dotenv').config({path: '/Users/meetmehta/Documents/serverless/product-management/test.env'})

const ProductPrice = require('../../models/ProductPrice');
const DBConnector = require('../../../../src/utils/db-connector');

const lambdaWrapper = mochaPlugin.lambdaWrapper;

let OPTION1 = "option1";
let OPTION2 = "option2";
let OPTION3 = "option3";
let OPTION4 = "option4";

let PRICE1 = 123;
let PRICE2 = 234;
let PRICE3 = 345;
let PRICE4 = 456;

describe('Test for add Price function', function () {
    let PriceManager;
    let stubConnectToDB;
    let stubProductPriceFindOne;
    let stubProductPriceCreate;
    let wrapped;

    beforeEach(function () {
        stubConnectToDB = sinon.stub(DBConnector, 'connectToDatabase');
        stubProductPriceFindOne = sinon.stub(ProductPrice, 'findOne');
        stubProductPriceCreate = sinon.stub(ProductPrice, 'create');
        PriceManager = require('../../functions/price-manager');
        wrapped = lambdaWrapper.wrap(PriceManager, {handler: 'addPrice'});
    });

    afterEach(function () {
        stubConnectToDB.restore();
        stubProductPriceFindOne.restore();
        stubProductPriceCreate.restore();
    });

    it('Returns Access Denied if accessed by any user except store', async function () {
        const event = {
            headers: factory.adminToken()
        }
        const response = await wrapped.run(event);
        expect(response).to.be.eql(factory.accessDeniedResponse());
        sinon.assert.calledOnce(stubConnectToDB);
    });

    it('Adds Document to database if product not found', async function () {
        const event = {
            headers: factory.storeToken(),
            body: factory.productPrices([OPTION1, OPTION2], [PRICE1, PRICE2], true)
        }
        const expectedProductPrice = factory.productPrices([OPTION1, OPTION2], [PRICE1, PRICE2],
            false);
        stubProductPriceFindOne.withArgs({
            storeId: expectedProductPrice.storeId,
            proId: expectedProductPrice.proId
        }).returns(null);

        const response = await wrapped.run(event);

        sinon.assert.calledOnce(stubConnectToDB);
        sinon.assert.calledOnce(stubProductPriceFindOne);
        sinon.assert.calledOnce(stubProductPriceCreate);

        expect(response).to.be.eql(ResponseGenerator.getResponseWithMessage(200,
            "Added to Database"));
        const writeArgs = stubProductPriceCreate.getCall(0).args[0];
        expect(writeArgs.pricing.length).to.be.eql(2);
    });

    it('Modifies Document to database if product is found', async function () {
        const event = {
            headers: factory.storeToken(),
            body: factory.productPrices([OPTION2, OPTION3], [PRICE2, PRICE3], true)
        }
        const expectedProductPrice = factory.productPrices([OPTION1, OPTION2, OPTION3],
            [PRICE1, PRICE2, PRICE3], false);
        const originalProductPrice = factory.productPrices([OPTION1, OPTION2], [PRICE1, PRICE2],
            false);

        stubProductPriceFindOne.withArgs({
            storeId: expectedProductPrice.storeId,
            proId: expectedProductPrice.proId
        }).returns(new ProductPrice(originalProductPrice));

        const response = await wrapped.run(event);

        sinon.assert.calledOnce(stubConnectToDB);
        sinon.assert.calledOnce(stubProductPriceFindOne);
        sinon.assert.calledOnce(stubProductPriceCreate);

        expect(response).to.be.eql(ResponseGenerator.getResponseWithMessage(200,
            "Added to Database"));
        const writeArgs = stubProductPriceCreate.getCall(0).args[0];
        expect(writeArgs.pricing.length).to.be.eql(3);
    })
});

describe('Test for get Price function', function () {
    let PriceManager;
    let stubConnectToDB;
    let stubProductPriceFindOne;
    let wrapped;

    beforeEach(function () {
        stubConnectToDB = sinon.stub(DBConnector, 'connectToDatabase');
        stubProductPriceFindOne = sinon.stub(ProductPrice, 'findOne');
        PriceManager = require('../../functions/price-manager');
        wrapped = lambdaWrapper.wrap(PriceManager, {handler: 'getPrice'});
    });

    afterEach(function () {
        stubConnectToDB.restore();
        stubProductPriceFindOne.restore();
    });

    it('Returns Access Denied if accessed by any user except store', async function () {
        const event = {
            headers: factory.adminToken()
        }
        const response = await wrapped.run(event);
        expect(response).to.be.eql(factory.accessDeniedResponse());
        sinon.assert.calledOnce(stubConnectToDB);
        sinon.assert.callCount(stubProductPriceFindOne, 0);
    });

    it('Returns Product Price Document if accessed by store', async function () {
        const expectedProductPrice = new ProductPrice(factory.productPrices([OPTION1, OPTION2],
            [PRICE1, PRICE2], false));
        const event = {
            headers: factory.storeToken(),
            pathParameters: {
                proId:  expectedProductPrice.proId
            }
        };

        stubProductPriceFindOne.withArgs({
            storeId: factory.storeId(),
            proId: expectedProductPrice.proId
        }).returns(expectedProductPrice);

        const response = await wrapped.run(event);

        sinon.assert.calledOnce(stubConnectToDB);
        sinon.assert.calledOnce(stubProductPriceFindOne);

        expect(response).to.be.eql(ResponseGenerator.getResponseWithObject(200, expectedProductPrice));
    })
});