import mongoose from "mongoose"
import ItemModel from "../models/items.model.js"
import itemQueue from "../queues/item.queue.js"
import { getRelatedItems as getRelatedItemsService } from "../services/recommendations.service.js"
import { generateEmbeddings } from "../services/embeddings.service.js"
import { queryVectors } from "../services/pinecone.service.js"

async function createItem(req, res) {
    try {
        const { title, url, type, category } = req.body;

        if (!title || typeof title !== "string" || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Title is required"
            });
        }

        console.log("📝 Creating item for user:", req.user.id);
        console.log("📝 Item data:", { title, url, type, category });

        const item = await ItemModel.create({
            userid: req.user.id,
            title: title.trim(),
            url,
            type,
            category: category || "Links",
            status: "pending"
        })
        console.log("✅ Item created:", item._id, "for user:", item.userid);
        
        try {
            await itemQueue.add("PROCESS_ITEM", { itemId: item._id, url })
            console.log("📨 Item added to processing queue:", item._id);
        } catch (queueError) {
            console.warn("⚠️ Could not add item to queue (Redis may be unavailable):", queueError.message);
            // Item is saved to DB; AI processing will be skipped until Redis is restored
        }
        
        return res.status(201).json({ success: true, item })

    } catch (error) {
        console.log("❌ Create item error:", error)
        if (error.name === "ValidationError") {
            return res.status(400).json({ success: false, message: error.message })
        }
        return res.status(500).json({ success: false, message: "Internal server error" })
    }
}

async function getitems(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;

        console.log("📂 Fetching items for user:", req.user.id);

        const total = await ItemModel.countDocuments({ userid: req.user.id });
        console.log("📊 Total items for this user:", total);

        const items = await ItemModel.find({ userid: req.user.id })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)

        console.log("📦 Returning", items.length, "items for page", page);
        res.json({ success: true, items, total, page, pages: Math.ceil(total / limit) })


    } catch (error) {
        console.log("❌ Get items error:", error)
        return res.status(500).json({ success: false, message: "Internal server error" })
    }
}

async function getItemById(req, res) {
    try {
        const item = await ItemModel.findOne({
            _id: req.params.id,
            userid: req.user.id
        })
        if (!item) {
            return res.status(404).json({ message: "item not found " })
        }
        res.json(item);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" })

    }
}

async function deleteitem(req, res) {
    try {
        const item = await ItemModel.findOneAndDelete({
            _id: req.params.id,
            userid: req.user.id
        })
        if (!item) {
            return res.status(404).json({ message: "item not found" })

        }
        res.json({ message: "Item deleted" });

    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "Internal server error" })
    }
}

async function getRelatedItems(req, res) {
    try {
        const id = (req.params.id ?? "").trim();
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: "Invalid item id" })
        }
        const item = await ItemModel.findOne({
            _id: id,
            userid: req.user.id
        })
        if (!item) {
            return res.status(404).json({ message: "item not found " })
        }
        const matches = await getRelatedItemsService(item._id);
        res.json({ success: true, matches });
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "Internal server error" })
    }
}

async function searchItems(req, res) {
    try {
        const { query } = req.query;
        if (!query || typeof query !== "string" || !query.trim()) {
            return res.json([]);
        }

        const trimmedQuery = query.trim();
        console.log(`🔍 Semantic Search triggered for: "${trimmedQuery}" (user: ${req.user.id})`);

        let semanticItemIds = [];

        // 1. Semantic Vector Search via Pinecone
        try {
            const queryEmbedding = await generateEmbeddings(trimmedQuery);
            if (queryEmbedding && queryEmbedding.length > 0) {
                const matches = await queryVectors(queryEmbedding, 20);
                if (matches && matches.length > 0) {
                    const rawIds = matches
                        .map(m => m.metadata?.itemId)
                        .filter(id => id && mongoose.isValidObjectId(id));
                    
                    semanticItemIds = Array.from(new Set(rawIds));
                    console.log(`🧠 Pinecone semantic matches found: ${semanticItemIds.length}`);
                }
            }
        } catch (semanticErr) {
            console.warn("⚠️ Vector semantic search error, falling back to regex search:", semanticErr.message);
        }

        // 2. Keyword Regex Search (MongoDB fallback / supplement)
        const regexItems = await ItemModel.find({
            userid: req.user.id,
            $or: [
                { title: { $regex: trimmedQuery, $options: "i" } },
                { tags: { $regex: trimmedQuery, $options: "i" } },
                { content: { $regex: trimmedQuery, $options: "i" } }
            ]
        }).sort({ createdAt: -1 });

        // 3. Fetch user's items corresponding to Pinecone semantic IDs
        let semanticItems = [];
        if (semanticItemIds.length > 0) {
            const fetchedSemantic = await ItemModel.find({
                _id: { $in: semanticItemIds },
                userid: req.user.id
            });
            const itemMap = new Map(fetchedSemantic.map(item => [item._id.toString(), item]));
            semanticItems = semanticItemIds
                .map(id => itemMap.get(id))
                .filter(Boolean);
        }

        // 4. Merge results: Semantic items first (by score rank), followed by Keyword matches
        const seenIds = new Set();
        const combined = [];

        for (const item of semanticItems) {
            const idStr = item._id.toString();
            if (!seenIds.has(idStr)) {
                seenIds.add(idStr);
                combined.push(item);
            }
        }

        for (const item of regexItems) {
            const idStr = item._id.toString();
            if (!seenIds.has(idStr)) {
                seenIds.add(idStr);
                combined.push(item);
            }
        }

        console.log(`✅ Returning ${combined.length} total search results`);
        return res.json(combined);
    } catch (error) {
        console.error("❌ Search items error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export default { createItem, getitems, getItemById, deleteitem, searchItems, getRelatedItems }