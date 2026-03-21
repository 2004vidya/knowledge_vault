import express from "express"
import itemController from "../controllers/item.controller.js"
import authUser from "../middlewares/auth.middleware.js"
import { createItemValidator } from "../validators/createitem.validator.js"
const itemRouter = express.Router()

itemRouter.get("/search-items", authUser, itemController.searchItems);

itemRouter.post("/create-item", authUser, createItemValidator, itemController.createItem);
itemRouter.get("/get-items", authUser, itemController.getitems);
itemRouter.get("/get-item/:id", authUser, itemController.getItemById);
itemRouter.delete("/delete-item/:id", authUser, itemController.deleteitem);


export default itemRouter