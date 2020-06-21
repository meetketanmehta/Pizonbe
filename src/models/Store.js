const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
    storeId: {
        type: String,
        required: true,
        unique: true
    },
    pan: {
        type: String,
        required: true,
        unique: true
    },
    gstin: {
        type: String,
        required: true,
        unique: true
    },
    storeName: {
        type: String,
        required: true
    },
    accountDetails: {
        accountNumber: {
            type: Number,
            required: true
        },
        accountName: {
            type: String,
            required: true
        },
        bankName: {
            type: String,
            required: true
        },
        ifscCode: {
            type: String,
            required: true
        }
    }
});

storeSchema.statics.findStoreNames = async function findStoreNames(storeIds) {
    console.log("Finding Store Names");
    const queryObj = {
        storeId:{
            $in: storeIds
        }
    };
    const projectionObj = {
        storeName: true,
        storeId: true
    };
    const stores = await this.find(queryObj, projectionObj).lean();
    let storeMap = {};
    stores.forEach((store) => {
        storeMap[store.storeId] = store.storeName;
    });
    return storeMap
}

var Store = mongoose.model('Store', storeSchema, process.env.USER_STORE_DETAILS_COLLECTION);

export default Store;