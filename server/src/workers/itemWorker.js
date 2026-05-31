import { Worker } from "bullmq";
import connection from "../config/redis.js";
import ItemModel from "../models/items.model.js";
import extractContent from "../services/contentExtractor.js";
import { generateTags } from "../services/ai.service.js";
import { ingestContent } from "../services/ingestion.service.js";

const itemWorker = new Worker("itemQueue", async (job) => {
    console.log("Processing job:", job.name, job.data);

    if (job.name === "PROCESS_ITEM") {
        const { itemId, url } = job.data;
        console.log(`Processing item ${itemId} from URL ${url}`);

        const extractedData = await extractContent(url);

        const tags = await generateTags(extractedData.content);
        console.log(`Tags generated for item ${itemId}:`, tags);

        

        const result = await ingestContent({
            title: extractedData.title,
            url: extractedData.url,
            content: extractedData.content,
            tags: tags,
        });

        // Update status to processed in DB
        await ItemModel.findByIdAndUpdate(itemId,
            {
                title: extractedData.title,
                content: extractedData.content,
                metadata: extractedData.metadata,
                tags:tags,
                status: "processed",
                
            }
        );
        console.log(`Item ${itemId} marked as processed`);


       

        

         
    }
}, { connection });

export default itemWorker;
