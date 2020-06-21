const mongoose = require('mongoose');
const CategoryManager = require('../functions/category-manager');

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    storeIds: [
        {
            type: String
        }
    ],
    options: [
        {
            type: String
        }
    ],
    category: {
        type: String,
        required: true
    },
    subCategory : {
        type: String,
        required: true
    },
    brand: {
        type: String,
        required: true
    },
    imageUri: String,
    approval: {
        status: String,
        approvedBy: String
    }
});

// productSchema.pre('save', function (next) {
//     if(this.approval == null) {
//         this['approval'] = {
//             status: "Not Approved"
//         }
//     }
//     next();
// });

productSchema.methods.matchCatAndSub = async function () {
    const product = this;
    return await CategoryManager.checkCatAndSub(product.category, product.subCategory);
};

productSchema.methods.addApproval = function(user) {
    var product = this;
    if(user.userType === 'store') {
        product['approval'] = {
            status: "Not Approved"
        };
    }
    if(user.userType === 'admin') {
        product['approval'] = {
            status: "Approved",
            approvedBy: user.userId
        };
    }
};

productSchema.methods.updateProduct = async function updateProduct(request) {
    if(request.hasOwnProperty('title'))
        this.title = request.title;
    if(request.hasOwnProperty('description'))
        this.description = request.description;
    if(request.hasOwnProperty('category')){
        this.category = request.category;
        this.subCategory = request.subCategory;
    }
    if(request.hasOwnProperty('imageUri'))
        this.imageUri = request.imageUri;
    if(request.hasOwnProperty('options'))
        this.options = request.options;
};

productSchema.methods.includeStore = function includeStore(storeId) {
    this.storeIds.indexOf(storeId) === -1 ? this.storeIds.push(storeId) : null ;
}

var Product = mongoose.model('Product', productSchema, process.env.DB_PRODUCTS_COLLECTION);

export default Product;
