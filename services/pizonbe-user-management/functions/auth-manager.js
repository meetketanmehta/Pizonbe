const jwt = require('jsonwebtoken');
const {capitalCase} = require('case-anything');
import UserAuth from "../models/UserAuth";
import * as ResponseGenerator from '../../../src/utils/response-generator';
import * as DBConnector from '../../../src/utils/db-connector';

export async function register(event, context) {
    try {
        const connect = DBConnector.connectToUsersDb();
        const requestBody = JSON.parse(event.body);
        console.log("Request body: " + JSON.stringify(requestBody));
        await connect;
        const newUser = new UserAuth(requestBody);
        await newUser.save();
        const jwtToken = await newUser.generateToken();
        return ResponseGenerator.getResponseWithObject(200, {authToken: jwtToken});
    } catch (err) {
        console.error(err);
        if(err.name === 'ValidationError') {
            let errorPaths = Object.keys(err.errors);
            errorPaths.forEach((errorPath, index, arr) => {arr[index] = capitalCase(errorPath)});
            const uniqueErrorIn = errorPaths.join(' and ');
            const responseString = uniqueErrorIn + " already registered";
            return ResponseGenerator.getResponseWithMessage(400, responseString);
        }
        return ResponseGenerator.getInternalErrorResponse();
    }
}

export async function login(event, context) {
    try {
        const connect = DBConnector.connectToUsersDb();
        const requestBody = JSON.parse(event.body);
        console.log("Request body: " + JSON.stringify(requestBody));
        await connect;
        console.log(UserAuth.collection.collectionName);
        console.log(requestBody.emailId);
        const dbUser = await UserAuth.findOne({emailId: requestBody.emailId});
        console.log(dbUser);
        if(dbUser == null) {
            return ResponseGenerator.getResponseWithMessage(400, "Email Id / Password is incorrect");
        }
        const matched = await dbUser.matchPassword(requestBody);
        if(matched) {
            const jwtToken = await dbUser.generateToken();
            return ResponseGenerator.getResponseWithObject(200, {authToken: jwtToken});
        }
        return ResponseGenerator.getResponseWithMessage(400, "Email Id / Password is incorrect");
    } catch (err) {
        console.error(err);
        return ResponseGenerator.getInternalErrorResponse();
    }
}

export async function getUserId(event, context) {
    try {
        const decodedUser = await jwt.verify(event.headers.authorizationToken, process.env.JWT_SECRET);
        return ResponseGenerator.getResponseWithObject(200, decodedUser);
    } catch (err) {
        console.error(err);
        return ResponseGenerator.getInternalErrorResponse();
    }
}
