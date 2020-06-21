'use strict';

var chai = require('chai');
var expect = chai.expect;
const ProductPrice = require('../../models/ProductPrice');

const pricing1 = {
    options: "option1",
    price: 123
};
const pricing2 = {
    options: "option2",
    price: 234
};
const pricing3 = {
    options: "option3",
    price: 345
};
const pricing4 = {
    options: "option2",
    price: 456
};
const TestStoreId = "Test Store";
const TestProId = "Test Product";
var productPrice ;
var addProductPrice;

beforeEach( () => {
    productPrice = new ProductPrice({
        storeId: TestStoreId,
        proId: TestProId,
        pricing: [pricing1, pricing2]
    });
    addProductPrice = new ProductPrice({
        storeId: TestStoreId,
        proId: TestProId,
        pricing: [pricing3]
    });
});

describe('Tests for addPricing function of Product Price Model', function () {
    it('Add pricing', async () => {
        await productPrice.addPricing(addProductPrice);
        expect(productPrice.pricing[0].price).to.equal(pricing1.price);
        expect(productPrice.pricing[1].price).to.equal(pricing2.price);
        expect(productPrice.pricing[2].price).to.equal(pricing3.price);
    });
    it('Update Pricing', async () => {
        addProductPrice.pricing.push(pricing4);
        await productPrice.addPricing(addProductPrice);
        expect(productPrice.pricing[0].price).to.equal(pricing1.price);
        expect(productPrice.pricing[1].price).to.equal(pricing4.price);
        expect(productPrice.pricing[2].price).to.equal(pricing3.price);
    });
});