import { body, validationResult } from "express-validator";

export const createItemValidator = [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("type").optional().isIn(["article", "link", "video", "tweet", "image", "pdf", "other"]).withMessage("Invalid item type"),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg,
                errors: errors.array()
            });
        }
        next();
    }
];

