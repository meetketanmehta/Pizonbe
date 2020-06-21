const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    userType: {
        type: String,
        required: true
    },
    addType: String,
    addName: {
        type: String,
        required: true
    },
    landmark: String,
    completeAdd: {
        type: String,
        required: true
    },
    coord: {
        type: {
            type: String,
            required: true
        },
        coordinates: [
            {
                type: Number,
                required: true
            }
        ]
    }
});

addressSchema.statics.findNearbyStores = async function findNearbyStores(latitude, longitude) {
    const projectionObj = {
        userId: true,
        _id: false
    };
    const queryObj = {
        userType: "store",
        coord: {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: [longitude, latitude]
                },
                $maxDistance: 5000
            }
        }
    };
    console.log("Finding stores near to Latitude: " + latitude + " Longitude: " + longitude);
    const addresses =  await this.find(queryObj, projectionObj);
    return addresses.map(address => address.userId);
};

var Address = mongoose.model('Address', addressSchema, process.env.USER_ADDRESS_COLLECTION);

export default Address;