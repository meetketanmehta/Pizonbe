const jwt = require('jsonwebtoken');
import Store from "../../../src/models/Store";
import * as ResponseGenerator from '../../../src/utils/response-generator';
import * as DBConnector from '../../../src/utils/db-connector';

export async function addStoreDetails(event, context) {
    try {
        await DBConnector.connectToUsersDb();
        const decodedUser = await jwt.verify(event.headers.authorizationToken, process.env.JWT_SECRET);
        if(decodedUser.userType !== 'store') {
            return ResponseGenerator.getResponseWithMessage(400, "Access Denied");
        }
        const storeDetails = await Store.findOne({_id: decodedUser.userId});
        if(storeDetails !== null) {
            return ResponseGenerator.getResponseWithMessage(400, "Details " +
                    "already present in database");
        }
        const requestBody = JSON.parse(event.body);
        requestBody["storeId"] = decodedUser.userId;
        const store = new Store(requestBody);
        await store.save();
        return ResponseGenerator.getResponseWithMessage(200, "Details added successfully " +
                "to database");
    } catch (err) {
        console.error(err);
        return ResponseGenerator.getInternalErrorResponse();
    }
}

export async function getStoreDetails(event, context) {
    try {
        await DBConnector.connectToUsersDb();
        const decodedUser = await jwt.verify(event.headers.authorizationToken, process.env.JWT_SECRET);
        const store = await Store.findOne({_id: decodedUser.userId});
        if(store === null) {
            return ResponseGenerator.getResponseWithMessage(400,"No details found");
        }
        return ResponseGenerator.getResponseWithObject(200, store);
    } catch(err) {
        console.log(err);
        return ResponseGenerator.getInternalErrorResponse();
    }
}