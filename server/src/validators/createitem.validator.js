import { body } from "express-validator";

export const createItemValidator = [
    body("title").notEmpty().withMessage("Title is required"),
    body("type").isIn(["article", "video", "tweet", "image", "pdf", "other"])
];

