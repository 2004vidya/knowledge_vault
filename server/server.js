import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";
import { connectTodb } from "./src/config/db.js";
import  "./src/workers/itemWorker.js"; // start the worker

const startServer = async () => {
    try {
        await connectTodb();
        const port = process.env.PORT || 3000;
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`)
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();