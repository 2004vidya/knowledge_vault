import mongoose from "mongoose";

const clusterSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        name: {
            type: String,
            default: "Untitled Cluster",
        },

        summary: {
            type: String,
            default: "",
        },

        itemIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Item",
            },
        ],

        tags: [String],

        embeddingId: {
            type: String,
        },

        itemCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

const Cluster = mongoose.model("Cluster", clusterSchema);

export default Cluster;