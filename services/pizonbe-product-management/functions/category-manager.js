import * as DBConnector from '../../../src/utils/db-connector';
import Category from "../models/Category";
import * as ResponseGenerator from '../../../src/utils/response-generator';

export async function getCategories (event, context) {
    try {
        await DBConnector.connectToProDb();
        const projectionObj = {
            category: true,
            catImageUri: true
        };
        const categories = await Category.find({}, projectionObj);
        return ResponseGenerator.getResponseWithObject(200, categories);
    } catch (err) {
        console.error(err);
        return ResponseGenerator.getInternalErrorResponse();
    }
}

export async function getSubCategories(event, context) {
    try {
        await DBConnector.connectToProDb();
        const queryObj = {};
        const queryStringParameters = event.queryStringParameters;
        if(queryStringParameters) {
            if(queryStringParameters.category)
                queryObj['category'] = queryStringParameters.category;
        }
        const categories = await Category.find(queryObj);
        return ResponseGenerator.getResponseWithObject(200, categories);
    } catch (err) {
        console.error(err);
        return ResponseGenerator.getInternalErrorResponse();
    }
}

export async function checkCatAndSub(category, subCategory) {
    await DBConnector.connectToProDb();
    const queryObj = {
        category: category,
        subCat: {
            $all: [
                {
                    subCategory: subCategory
                }
            ]
        }
    };
    const catDocument = await Category.findOne(queryObj);
    return catDocument !== null;
}