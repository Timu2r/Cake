import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true }, // base price
    image: { type: String, required: true },
    description: { type: String, required: true },
    preparationTime: { type: String, required: false },

    ingredients: {
        type: [String], // list of ingredients
        required: false
    },

    sizes: [
        {
            label: { type: String, required: true },
            price: { type: Number, required: true }
        }
    ],

    orderCount: {
        type: Number,
        default: 0
    },

    rating: {
        average: { type: Number, default: 0 }, // avg rating
        count: { type: Number, default: 0 } // number of ratings
    },

    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // references the baker
        required: true
    },

    isAvailable: { type: Boolean, default: true }, // product availability
    tags: [String], // e.g. ["chocolate", "wedding", "custom"]
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);

export default Product;
