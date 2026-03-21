import app from "./src/app.js";
import { connectTodb } from "./src/config/db.js";
import  "./src/workers/itemWorker.js"; // start the worker
connectTodb();

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`)
})