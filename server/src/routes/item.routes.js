import express from "express"
import itemController from "../controllers/item.controller.js"
import authUser from "../middlewares/auth.middleware.js"
const itemRouter = express.Router()

itemRouter.post("/create-item", authUser, itemController.createItem);
itemRouter.get("/get-items", authUser, itemController.getitems);
itemRouter.get("/get-item/:id", authUser, itemController.getItemById);
itemRouter.delete("/delete-item/:id", authUser, itemController.deleteitem);

export default itemRouter