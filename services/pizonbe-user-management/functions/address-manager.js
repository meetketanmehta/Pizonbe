const jwt = require('jsonwebtoken');
import Address from '../../../src/models/Address';
import * as ResponseGenerator from '../../../src/utils/response-generator';
import * as DBConnector from '../../../src/utils/db-connector';

export async function addAddress(event, context) {
    try {
        console.log("Request event : " + event);
        const connect = DBConnector.connectToUsersDb();
        const requestBody = JSON.parse(event.body);
        const decodedUser = await jwt.verify(event.headers.authorizationtoken, process.env.JWT_SECRET);
        if(decodedUser.userType !== 'customer') {
            const address = await Address.findOne({userId: decodedUser.userId});
            if(address !== null) {
                return ResponseGenerator.getResponseWithMessage(400, "Address already present in database");
            }
        }
        requestBody['userId'] = decodedUser.userId;
        requestBody['userType'] = decodedUser.userType;
        requestBody['coord'] = {
            type: "Point",
            coordinates: requestBody['coordinates']
        };
        const address = new Address(requestBody);
        await connect;
        await address.save();
        return ResponseGenerator.getResponseWithMessage(200, "Address added successfully");
    } catch (err) {
        if(err.name === "TokenExpiredError" || err.name === "JsonWebTokenError" || err.name === "NotBeforeError") {
            return ResponseGenerator.getResponseWithMessage(400, err.message);
        }
        return ResponseGenerator.getInternalErrorResponse();
    }
}

export async function getAddress(event, context) {
    try {
        const connect =  DBConnector.connectToUsersDb();
        const decodedUser = await jwt.verify(event.headers.authorizationtoken, process.env.JWT_SECRET);
        const queryObj = {
            userId: decodedUser.userId
        };
        await connect;
        let addresses = await Address.find(queryObj).lean();
        addresses.forEach((address) => {
            address['coordinates'] = address.coord.coordinates;
            delete address['coord'];
        });
        return ResponseGenerator.getResponseWithObject(200, addresses);
    } catch (err) {
        console.error(err);
        if(err.name === "TokenExpiredError" || err.name === "JsonWebTokenError" || err.name === "NotBeforeError") {
            return ResponseGenerator.getResponseWithMessage(400, err.message);
        }
        return ResponseGenerator.getInternalErrorResponse();
    }
}