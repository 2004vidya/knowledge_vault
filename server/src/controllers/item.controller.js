import ItemModel from "../models/items.model.js"
async function createItem(req, res) {
    try {
        const { title, url, type } = req.body;

        const item = await ItemModel.create({
            userid: req.user.id,
            title,
            url,
            type
        })
        return res.status(201).json({ success: true, item })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "Internal server error" })
    }
}

async function getitems(req, res) {
    try {
        const items = await ItemModel.find({ userId: req.user.id })
            .sort({ createdAt: -1 })

        res.json({ success: true, items })


    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "Internal server error" })
    }
}

async function getItemById(req, res) {
    try {
        const item = await ItemModel.findOne({
            _id: req.params.id,
            userId: req.user.id
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
            userId: req.user.id
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

export default { createItem, getitems, getItemById, deleteitem }