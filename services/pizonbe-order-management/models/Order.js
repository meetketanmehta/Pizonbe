const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    custId: {
        type: String,
        required: true
    },
    storeId: {
        type: String,
        required: true
    },
    storeName: {
        type: String,
        required: true
    },
    deliveryAddress: {
        addId: {
            type: String,
            required: true
        },
        contactNumber: {
            type: Number,
            required: true
        },
        coord: {
            type: {
                type: String
            },
            coordinates: [
                {
                    type: Number,
                }
            ]
        }
    },
    products: [
        {
            proId: String,
            title: String,
            options: String,
            price: Number,
            quantity: Number
        }
    ],
    status: {
        type: String,
        default: "WAITING FOR STORE CONFIRMATION"
    },
    productsTotal: {
        type: Number
    },
    deliveryCharge: {
        type: Number
    },
    totalAmount: {
        type: Number
    },
    orderTime: {
        type: Date,
        default: Date()
    },
    deliveredTime: {
        type: Date
    },
    deliveryExecutive: {
        status: {
            type: String,
            default: "NOT ASSIGNED"
        },
        delExecId: String,
        delExecName: String
    },
});

orderSchema.statics.fromJSON = function fromJSON(orderJSON) {
    if(!orderJSON.deliveryAddress.coord) {
        orderJSON.deliveryAddress["coord"] = {
            type: "Point",
            coordinates: orderJSON.deliveryAddress.coordinates
        };
        delete orderJSON.deliveryAddress.coordinates;
    }
    if(!orderJSON.productsTotal) {
        let total = 0;
        orderJSON.products.forEach((product) => {
            total+= product.price * product.quantity;
        });
        orderJSON.productsTotal = total;
    }
    if(!orderJSON.totalAmount) {
        orderJSON["totalAmount"] = orderJSON.productsTotal + orderJSON.deliveryCharge;
    }
    return this(orderJSON);
};

var Order = mongoose.model('Order', orderSchema, process.env.ORDERS_COLLECTION);

export default Order;