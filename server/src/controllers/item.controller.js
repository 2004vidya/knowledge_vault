import ItemModel from "../models/items.model.js"
import itemQueue from "../queues/item.queue.js"

async function createItem(req, res) {
    try {
        const { title, url, type } = req.body;
        
        console.log("📝 Creating item for user:", req.user.id);
        console.log("📝 Item data:", { title, url, type });

        const item = await ItemModel.create({
            userid: req.user.id,
            title,
            url,
            type,
            status: "pending"
        })
        console.log("✅ Item created:", item._id, "for user:", item.userid);
        
        await itemQueue.add("PROCESS_ITEM", { itemId: item._id, url })
        return res.status(201).json({ success: true, item })

    } catch (error) {
        console.log("❌ Create item error:", error)
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

async function searchItems(req, res) {
    try {
        const { query } = req.query;
        const items = await ItemModel.find({
            userid: req.user.id,
            $or: [
                { title: { $regex: query, $options: "i" } },
                { tags: { $regex: query, $options: "i" } }
            ]
        }).sort({ createdAt: -1 })
        res.json(items);
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "Internal server error" })
    }

}

export default { createItem, getitems, getItemById, deleteitem, searchItems }