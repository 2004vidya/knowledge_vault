import mongoose from "mongoose"

const itemSchema = new mongoose.Schema({
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true

    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
    },
    url: {
        type: String
    },
    type: {
        type: String,
        enum: ["article","link", "video", "tweet", "image", "pdf", "other"],
        default: "other"
    },
    tags: {
        type: [String],
        default: []
    },
    category: {
        type: String,
        default: "Links"
    },
    metadata: {
        description: String,
        image: String,
        author: String,
        siteName: String
    },
    status: {
        type: String,
        enum: ["pending", "processed"],
        default: "pending"
    },
    clusterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cluster",
    default: null
    }

}, { timestamps: true })

const itemModel = mongoose.model("Item", itemSchema)

export default itemModel