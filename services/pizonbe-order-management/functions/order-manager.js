import Order from '../models/Order';
import * as DBConnector from '../../../src/utils/db-connector';
import * as ResponseGenerator from '../../../src/utils/response-generator';
import * as Validator from '../../../src/utils/validator';
const jwt = require('jsonwebtoken');

const placeOrderPermission = ['customer'];
// const getOrdersPermission = ['customer', 'store'];

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