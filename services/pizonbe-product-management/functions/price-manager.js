import ProductPrice from "../models/ProductPrice";
import * as DBConnector from '../../../src/utils/db-connector';
import UserTypes from "../../../res/values/user-types";
import StringValues from "../../../res/values/string-values";
import * as ResponseGenerator from '../../../src/utils/response-generator';
import * as Validator from '../../../src/utils/validator';
import Product from "../../../src/models/Product";
const jwt = require('jsonwebtoken');

const addPricePermission = [UserTypes.store];
const getPricePermission = ['store'];

/**
 * This function adds price to price database. It extracts storeId from JWT and also adds storeId to product database.
 * @param event
 * @param context
 * @returns {Promise<{headers: {"Access-Control-Allow-Origin": string, "Access-Control-Allow-Credentials": boolean}, body: string, statusCode: *}|{headers: {"Access-Control-Allow-Origin": string, "Access-Control-Allow-Credentials": boolean}, body: string, statusCode: number}>}
 */
export async function addPrices(event, context) {
    try {
        const connect = DBConnector.connectToProDb();
        const decodedUser = await jwt.verify(event.headers[StringValues.authorizationToken], process.env.JWT_SECRET);
        console.info("Requested by : " + decodedUser);
        const permitted = Validator.checkIfPermitted(decodedUser.userType, addPricePermission);
        if(!permitted) {
            return ResponseGenerator.getAccessDeniedResponse();
        }
        const requestBody = JSON.parse(event.body);
        console.info("Request body : " + requestBody);
        await connect;
        for(let index in requestBody) {
            const request = requestBody[index];
            const proId = request.proId;
            const product = await Product.findOne({_id: proId});
            product.includeStore(decodedUser.userId);
            console.log(product);
            await product.save();
            request['storeId'] = decodedUser.userId;
            request['storeName'] = decodedUser.name;
            const proPrice = new ProductPrice(request);
            console.log(proPrice);
            await proPrice.save();
        }
        return ResponseGenerator.getResponseWithMessage(200, "Prices added to database successfully");
    } catch (err) {
        console.error(err);
        return ResponseGenerator.getInternalErrorResponse();
    }
}


export async function getPrice(event, context) {
    try {
        await DBConnector.connectToProDb();
        const decodedUser = await jwt.verify(event.headers.authorizationToken, process.env.JWT_SECRET);
        const hasPermission = authorizer.checkIfIncludes(decodedUser, getPricePermission);
        if(!hasPermission) {
            return ResponseGenerator.getResponseWithMessage(400, "Access Denied");
        }
        const queryObj = {
            storeId: decodedUser.userId,
            proId: event.pathParameters.proId
        };
        const productPrice = await ProductPrice.findOne(queryObj);
        return ResponseGenerator.getResponseWithObject(200, productPrice);
    } catch (err) {
        console.error(err);
        return ResponseGenerator.getResponseWithMessage(500, err.message);
    }
}
