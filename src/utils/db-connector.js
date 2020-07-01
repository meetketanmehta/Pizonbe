const mongoose = require('mongoose');
const dbUri = process.env.DB_URI;
const usersDbName = process.env.USER_DB_NAME;
const proDbName = process.env.PRODUCTS_DB_NAME;
const ordersDbName = process.env.ORDERS_DB_NAME;
let usersDbConnection;
let proDbConnection;
let ordersDbConnection;
let isUsersDbConnected;
let isProDbConnected;
let isOrdersDbConnected;

export async function createUsersDbConnection () {
    if(!usersDbConnection) {
        console.log("=> Creating new local connection to Users DB");
        usersDbConnection = await mongoose.createConnection(dbUri + "/" + usersDbName);
        return usersDbConnection;
    }
    console.log("=> Using already connected local connection to Users DB");
    return usersDbConnection;
}

export async function createProDbConnection() {
    if(!proDbConnection) {
        console.log("=> Creating new local connection to Pro DB");
        proDbConnection = await mongoose.createConnection(dbUri + "/" + proDbName);
        return proDbConnection;
    }
    console.log("=> Using already connected local connection to Pro DB");
    return proDbConnection;
}

export async function createOrdersDbConnection() {
    if(!ordersDbConnection) {
        console.log("=> Creating new local connection to Orders DB");
        ordersDbConnection = await mongoose.createConnection(dbUri + "/" + ordersDbName);
        return ordersDbConnection;
    }
    console.log("=> Using already connected local connection to Orders DB");
    return ordersDbConnection;
}

export async function connectToUsersDb() {
    if(!isUsersDbConnected) {
        console.log("=> Creating new global connection to Users DB");
        await mongoose.connect(dbUri + "/" + usersDbName);
        console.log(mongoose.connection.name);
        isUsersDbConnected = true;
        return isUsersDbConnected;
    }
    console.log("=> Using already connected global connection to Users DB");
    return isUsersDbConnected;
}

export async function connectToProDb() {
    if(!isProDbConnected) {
        console.log("=> Creating new global connection to Pro DB");
        await mongoose.connect(dbUri + "/" +proDbName);
        isProDbConnected = true;
        return isProDbConnected;
    }
    console.log("=> Using already connected global connection to Pro DB");
    return isProDbConnected;
}

export async function connectToOrdersDb() {
    if(!isOrdersDbConnected) {
        console.log("=> Creating new global connection to Orders DB");
        await mongoose.connect(dbUri + "/" + ordersDbName);
        isOrdersDbConnected = true;
        return isOrdersDbConnected;
    }
    console.log("=> Using already connected global connection to Orders DB");
    return isOrdersDbConnected;
}