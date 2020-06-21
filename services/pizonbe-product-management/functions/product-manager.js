const mongoose = require('mongoose');
const Promise = require('promise');
const jwt = require('jsonwebtoken');
import * as ResponseGenerator from '../../../src/utils/response-generator';
import Product from "../models/Product";
import * as DBConnector from '../../../src/utils/db-connector';
import Address from '../../../src/models/Address';
import ProductPrice from "../models/ProductPrice";
import * as Validator from '../../../src/utils/validator';
import Store from "../../../src/models/Store";

const url =  process.env.DB_URI + "/" + process.env.PRODUCTS_DB_NAME;

const getBrandsPermission = ['customer', 'store', 'admin'];
const addProductsPermission = ['admin'];

export async function getBrands(event, context) {
    try {
        const connect = DBConnector.connectToProDb();
        const decodedUser = await jwt.verify(event.headers.authorizationToken, process.env.JWT_SECRET);
        const hasPermission = Validator.checkIfIncludes(decodedUser, getBrandsPermission);
        if(!hasPermission) {
            return ResponseGenerator.getResponseWithMessage(403, "Access Denied");
        }
        let queryObj = {};
        const queryStringParameters = event.queryStringParameters;
        if(queryStringParameters) {
            if(queryStringParameters.category)
                queryObj['category'] = queryStringParameters.category;
            if(queryStringParameters.subCategory)
                queryObj['subCategory'] = queryStringParameters.subCategory;
        }
        const projectionObj = {
            _id: false,
            brand: true
        };
        await connect;
        const products = await Product.find(queryObj, projectionObj);
        if(!products)
            return ResponseGenerator.getResponseWithObject(404, []);
        const brands = products.map(product => product.brand);
        const brandsFiltered = Array.from(new Set(brands));
        return ResponseGenerator.getResponseWithObject(200, brandsFiltered);
    } catch (err) {
        console.error(err);
        return ResponseGenerator.getResponseWithMessage(500, err.message);
    }
}

/**
 * This function adds products to Database. It adds approval status based on userType of requester
 * @param event
 * @param context
 * @returns {Promise<{headers: {"Access-Control-Allow-Origin": string, "Access-Control-Allow-Credentials": boolean}, body: string, statusCode: *}|{headers: {"Access-Control-Allow-Origin": string, "Access-Control-Allow-Credentials": boolean}, body: string, statusCode: number}>}
 */
export async function addProducts(event, context) {
    try {
        const connect = DBConnector.connectToProDb();
        const decodedUser = await jwt.verify(event.headers.authorizationtoken, process.env.JWT_SECRET);
        console.info("Request by : " + decodedUser);
        const permitted = Validator.checkIfPermitted(decodedUser.userType, addProductsPermission);
        if(!permitted) {
            return ResponseGenerator.getAccessDeniedResponse();
        }
        const requestBody = JSON.parse(event.body);
        console.info("Request Body : " + requestBody);
        let products = [];
        requestBody.forEach((requestBodyProduct) => {
            let product = new Product(requestBodyProduct);
            product.addApproval(decodedUser);
            products.push(product);
        });
        await connect;
        await Product.create(products);
        return ResponseGenerator.getResponseWithMessage(200, "Products added to Database");
    } catch (err) {
        console.error(err);
        return ResponseGenerator.getResponseWithMessage(400, err.message);
    }
}

export async function approveProduct(event, context) {
    try {
        const decodedUser = await jwt.verify(event.headers.authorizationToken, process.env.JWT_SECRET);
        if(decodedUser.userType !== 'admin')
            return ResponseGenerator.getResponseWithMessage(400, "Access Denied");
        await DBConnector.connectToProductsDB();
        const requestBody = JSON.parse(event.body);
        const product = await Product.findOne({_id: requestBody._id});
        console.log(product);
        await product.updateProduct(requestBody);
        await product.addApproval(decodedUser);
        await product.save();
        return ResponseGenerator.getResponseWithMessage(200, "Product Approved");
    } catch (err) {
        console.error(err);
        return ResponseGenerator.getResponseWithMessage(400, err.message);
    }
}

export async function getUnApprovedProducts(event, context) {
    try {
        const decodedUser = await jwt.verify(event.headers.authorizationToken, process.env.JWT_SECRET);
        const hasRights = Validator.checkIfIncludes(decodedUser, ['admin']);
        if(!hasRights) {
            return ResponseGenerator.getUnauthorizedResponse();
        }
        await mongoose.connect(url);
        const queryObj = {
            "approval.status": "Not Approved"
        };
        if(event.pathParameters) {
            if(event.pathParameters.category)
                queryObj["category"] = decodeURI(event.pathParameters.category);
            if(event.pathParameters.subCategory)
                queryObj["subCategory"] = decodeURI(event.pathParameters.subCategory);
        }
        var products = await Product.find(queryObj);
        return ResponseGenerator.getResponseWithObject(200, products);
    } catch (err) {
        console.error(err);
        return ResponseGenerator.getResponseWithMessage(400, err.message);
    }
}

/**
 * This function returns all the approved products. If returns all the products available in 5 kms radius if latitude and longitude is provided
 * @param event
 * @param context
 * @returns {Promise<{headers: {"Access-Control-Allow-Origin": string, "Access-Control-Allow-Credentials": boolean}, body: string, statusCode: number}|{headers: {"Access-Control-Allow-Origin": string, "Access-Control-Allow-Credentials": boolean}, body: string, statusCode: *}>}
 */
export async function getProducts(event, context) {
    try {
        const [usersConnection , proConnection] = await Promise.all([DBConnector.createUsersDbConnection(), DBConnector.createProDbConnection()]);
        const Address = await usersConnection.model('Address', mongoose.model('Address').schema, mongoose.model('Address').collection.collectionName);
        const Product = await proConnection.model('Product', mongoose.model('Product').schema, mongoose.model('Product').collection.collectionName);
        const ProductPrice = await proConnection.model('ProductPrice', mongoose.model('ProductPrice').schema, mongoose.model('ProductPrice').collection.collectionName);
        const Store = await usersConnection.model('Store', mongoose.model('Store').schema, mongoose.model('Store').collection.collectionName);

        let productQueryObj = {
            "approval.status": "Approved"
        };
        let storeIds = [];
        let storeNames = {};
        if(event.queryStringParameters) {
            const latitude = event.queryStringParameters.latitude;
            const longitude = event.queryStringParameters.longitude;
            storeIds = await Address.findNearbyStores(latitude, longitude);
            storeNames = await Store.findStoreNames(storeIds);
            productQueryObj['storeIds'] = {
                $in: storeIds
            };
        }
        if(event.pathParameters) {
            if (event.pathParameters.category) {
                console.info("Category path params : " + event.pathParameters.category);
                productQueryObj['category'] = decodeURI(event.pathParameters.category);
            }
            if (event.pathParameters.subCategory) {
                console.info("Sub Category path params : " + event.pathParameters.subCategory);
                productQueryObj['subCategory'] = decodeURI(event.pathParameters.subCategory);
            }
        }

        const productProjectionObj = {
            approval: false,
            storeIds: false,
            options: false,
            __v: false
        }

        console.info("Finding Products");
        const products = await Product.find(productQueryObj, productProjectionObj).skip().limit().lean();

        const productPriceQueryObj = {
            $or: []
        };

        products.forEach((product) => {
            storeIds.forEach((storeId) => {
                productPriceQueryObj['$or'].push({
                    proId: product._id,
                    storeId: storeId
                });
            });
        });

        let productPrices = [];
        if(productPriceQueryObj['$or'].length !== 0) {
            console.info("Finding Product Prices");
            productPrices = await ProductPrice.find(productPriceQueryObj).lean();
        }

        products.forEach((product) => {
            const proId = product._id;
            product['pricing'] = [];
            productPrices.forEach((productPrice) => {
                 if(productPrice.proId == proId) {
                     const storeName = storeNames[productPrice.storeId];
                     productPrice['pricing'].forEach((pricing) => {
                         pricing['storeId'] = productPrice.storeId;
                         pricing['storeName'] = storeName;
                         delete pricing['_id'];
                         product["pricing"].push(pricing);
                     });
                 }
            });
        });

        return ResponseGenerator.getResponseWithObject(200, products);
    } catch(err) {
        console.error(err);
        return ResponseGenerator.getInternalErrorResponse();
    }
}