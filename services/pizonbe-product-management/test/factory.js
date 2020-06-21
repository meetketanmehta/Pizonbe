const ResponseGenerator = require('../../../src/utils/response-generator')
const Product = require('../models/Product');
const Category = require('../models/Category');

module.exports.adminToken = function () {
    return {
        authorizationToken: process.env.ADMIN_ACCESS_TOKEN
    }
}

module.exports.storeToken = function() {
    return {
        authorizationToken: process.env.STORE_ACCESS_TOKEN
    }
}

module.exports.storeId = function() {
    return process.env.STORE_ID;
}

module.exports.customerToken = function() {
    return{
        authorizationToken: process.env.CUSTOMER_ACCESS_TOKEN
    }
}

module.exports.productPrices  = function (options, prices, stringify) {
    var pricing = [];
    for(const index in options) {
        pricing.push({
            options: options[index],
            price: prices[index]
        });
    }
    const productPrice = {
        storeId: "Test Store Id",
        proId: "Test Product Id",
        pricing: pricing
    };
    if(stringify) {
        return JSON.stringify(productPrice);
    }
    return productPrice;
}

module.exports.accessDeniedResponse = function () {
    return ResponseGenerator.getResponseWithMessage(400, "Access Denied");
}

module.exports.products = function (request) {
    const testProductObj = {
        title: "Test Title",
        description: "Test Description",
        options: ["Test Option1", "Test Option2"],
        storeIds: [process.env.STORE_ID],
        category: "Test Category",
        subCategory: "Test SubCategory",
        brand: "Test Brand",
        imageUri: "Test URL",
        approval: {
            status: "Approved",
            approvedBy: process.env.ADMIN_ID
        }
    }
    if(!request)
        return new Product(testProductObj);
    const key = Object.keys(request)[0];
    const products = [];
    request[key].forEach((value) => {
        const product = new Product(testProductObj);
        product[key] = value;
        products.push(product);
    });
    return products;
}

module.exports.categories = function() {
    return [ new Category({
        category: "Test Category",
        catImageUri: "Test Uri",
        subCat: [
            {
                subCategory: "Test SubCategory1",
                subCatImageUri: "Test SubCategory1Uri"
            }
        ]
    }) ];
}