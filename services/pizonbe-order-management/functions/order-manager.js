import Order from '../models/Order';
import Product from "../../../src/models/Product";
import Address from "../../../src/models/Address";
import * as DBConnector from '../../../src/utils/db-connector';
import * as ResponseGenerator from '../../../src/utils/response-generator';
import * as Validator from '../../../src/utils/validator';
const jwt = require('jsonwebtoken');
const Promise = require('promise');
const mongoose = require('mongoose');

const placeOrderPermission = ['customer'];
const getOrdersPermission = ['customer', 'store'];
const getOrderDetailsPermission = ['customer', 'store'];

/**
 * This function creates a separate order for each store and adds complete data to DB
 * @param event
 * @param context
 * @returns {Promise<{headers: {"Access-Control-Allow-Origin": string, "Access-Control-Allow-Credentials": boolean}, body: string, statusCode: *}|{headers: {"Access-Control-Allow-Origin": string, "Access-Control-Allow-Credentials": boolean}, body: string, statusCode: number}>}
 */
export async function placeOrder(event, context) {
    try {
        const connect = DBConnector.connectToOrdersDb();
        const decodedUser = await jwt.verify(event.headers.authorizationtoken, process.env.JWT_SECRET);
        const permitted = Validator.checkIfPermitted(decodedUser.userType, placeOrderPermission);
        if(!permitted) {
            return ResponseGenerator.getForbiddenResponse();
        }
        const requestBody = JSON.parse(event.body);

        let productDetails = {};
        let deliveryAddress = {};
        let deliveryCharges = {};

        requestBody.productDetails.forEach((requestProduct) => {
            if(!productDetails[requestProduct.storeId]) {
                productDetails[requestProduct.storeId] = [];
            }
            productDetails[requestProduct.storeId].push(requestProduct);
        });
        deliveryAddress = requestBody.userDetails.deliveryAddress;
        deliveryCharges = requestBody.deliveryCharges;

        let orders = [];
         for(let storeId in productDetails) {
            let orderJSON = {};
            orderJSON.custId = decodedUser.userId;
            orderJSON.storeId = storeId;
            orderJSON.storeName = productDetails[storeId][0].storeName;
            orderJSON.deliveryAddress = deliveryAddress;
            orderJSON.products = productDetails[storeId];
            orderJSON.deliveryCharge = deliveryCharges[storeId];

            const order = Order.fromJSON(orderJSON);
            orders.push(order);
        }
        await connect;
        await Order.create(orders);
        return ResponseGenerator.getResponseWithMessage(200,"Order Placed Successfully");
    } catch (err) {
        console.error(err);
        return ResponseGenerator.getInternalErrorResponse();
    }
}

/**
 * This function gives a list of orders based on the userId in authorizationtoken in headers
 * @param event
 * @param context
 * @returns {Promise<{headers: {"Access-Control-Allow-Origin": string, "Access-Control-Allow-Credentials": boolean}, body: string, statusCode: *}|{headers: {"Access-Control-Allow-Origin": string, "Access-Control-Allow-Credentials": boolean}, body: string, statusCode: number}>}
 */
export async function getOrders(event, context) {
    try {
        const connect = DBConnector.connectToOrdersDb();
        const decodedUser = await jwt.verify(event.headers.authorizationtoken, process.env.JWT_SECRET);
        const permitted = Validator.checkIfPermitted(decodedUser.userType, getOrdersPermission);
        if(!permitted) {
            return ResponseGenerator.getForbiddenResponse();
        }
        const queryObj = {};
        if(decodedUser.userType === 'customer') {
            queryObj.custId = decodedUser.userId;
        }
        if(decodedUser.userType === 'store') {
            queryObj.storeId = decodedUser.userId;
        }
        if(event.queryStringParameters.ordersType === "Pending") {
            queryObj.status = {
                $in: [
                    "WAITING FOR STORE CONFIRMATION",
                    "DELIVERY EXECUTIVE ASSIGNED"
                ]
            };
        }
        if(event.queryStringParameters.ordersType === "Completed"){
            console.log("Hey");
            queryObj.status = "DELIVERED";
        }
        const projectionObj = {
            deliveryExecutive: false,
        };
        await connect;
        const orders = await Order.find(queryObj, projectionObj).lean();
        orders.forEach((order) => {
            order.deliveryAddress.coordinates = order.deliveryAddress.coord.coordinates;
            delete order.deliveryAddress.coord;
        });
        return ResponseGenerator.getResponseWithObject(200, orders);
    } catch (err) {
        console.error(err);
        return ResponseGenerator.getInternalErrorResponse();
    }
}

/**
 * This function gives complete order details for the given orderId in pathParameters. It fetches complete address details from Address DB and product details from Product DB.
 * @param event
 * @param context
 * @returns {Promise<{headers: {"Access-Control-Allow-Origin": string, "Access-Control-Allow-Credentials": boolean}, body: string, statusCode: *}|{headers: {"Access-Control-Allow-Origin": string, "Access-Control-Allow-Credentials": boolean}, body: string, statusCode: number}>}
 */
export async function getOrderDetails(event, context) {
    try {
        const [ordersConnection, proConnection, usersConnection] = await Promise.all([DBConnector.createOrdersDbConnection(), DBConnector.createProDbConnection(), DBConnector.createUsersDbConnection()]);
        const Order = await ordersConnection.model('Order', mongoose.model('Order').schema, mongoose.model('Order').collection.collectionName);
        const Product = await proConnection.model('Product', mongoose.model('Product').schema, mongoose.model('Product').collection.collectionName);
        const Address = await usersConnection.model('Address', mongoose.model('Address').schema, mongoose.model('Address').collection.collectionName);

        const decodedUser = await jwt.verify(event.headers.authorizationtoken, process.env.JWT_SECRET);
        const permitted = Validator.checkIfPermitted(decodedUser.userType, getOrderDetailsPermission);
        if(!permitted) {
            return ResponseGenerator.getForbiddenResponse();
        }
        const queryObj = {};
        if(decodedUser.userType === 'customer') {
            queryObj.custId = decodedUser.userId;
        }
        if(decodedUser.userType === 'store') {
            queryObj.storeId = decodedUser.userId;
        }
        queryObj._id = event.pathParameters.orderId;
        const order = await Order.findOne(queryObj).lean();

        order.deliveryAddress.coordinates = order.deliveryAddress.coord.coordinates;
        delete order.deliveryAddress.coord;
        console.log(order);

        const addressQueryObj = {
            _id: order.deliveryAddress.addId
        };
        const addressProjectionObj = {
            _id: false,
            addName: true,
            completeAdd: true,
            addType: true,
            landmark: true
        };
        let address = await Address.findOne(addressQueryObj, addressProjectionObj).lean();
        order.deliveryAddress = Object.assign(order.deliveryAddress, address);
        console.log(order);

        const productsQueryObj = {
            $or: []
        };
        order.products.forEach((product) => {
            productsQueryObj.$or.push({_id: product.proId});
        });
        const productsProjectionObj = {
            _id: true,
            imageUri: true,
            category: true,
            subCategory: true,
            brand: true,
            description: true
        };
        let productDetails = await Product.find(productsQueryObj, productsProjectionObj).lean();
        order.products.forEach((product) => {
            productDetails.forEach((productDetail) => {
                if(product.proId == productDetail._id) {
                    product = Object.assign(product, productDetail);
                }
            });
        });
        console.log(order);

        return ResponseGenerator.getResponseWithObject(200, order);
    } catch (err) {
        console.error(err);
        return ResponseGenerator.getInternalErrorResponse();
    }
}