import Order from '../models/Order';
import * as DBConnector from '../../../src/utils/db-connector';
import * as ResponseGenerator from '../../../src/utils/response-generator';
import * as Validator from '../../../src/utils/validator';
const jwt = require('jsonwebtoken');

const placeOrderPermission = ['customer'];
const getOrdersPermission = ['customer', 'store'];

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