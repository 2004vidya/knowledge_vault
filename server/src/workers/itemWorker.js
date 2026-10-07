import { Worker } from "bullmq";
import connection from "../config/redis.js";
import ItemModel from "../models/items.model.js";
import extractContent from "../services/contentExtractor.js";
import { generateTags } from "../services/ai.service.js";
import { ingestContent } from "../services/ingestion.service.js";
import { assignClusterForItem } from "../services/cluster.service.js";

const itemWorker = new Worker("itemQueue", async (job) => {
    console.log("Processing job:", job.name, job.data);

    if (job.name === "PROCESS_ITEM") {
        const { itemId, url } = job.data;
        console.log(`Processing item ${itemId} from URL ${url}`);

        const extractedData = await extractContent(url);
        console.log(`📄 Extracted title: "${extractedData.title}", content length: ${extractedData.content?.length || 0}`);

        const tags = await generateTags(extractedData.content);
        console.log(`Tags generated for item ${itemId}:`, tags);

        // Always update DB with whatever we extracted (title, metadata, tags)
        // even if content is empty — so the card shows a real title and tags
        const updateData = {
            status: "processed",
            tags: tags && tags.length > 0 ? tags : ["General"],
        };
        if (extractedData.title) {
            updateData.title = extractedData.title;
        } else {
            try {
                const parsedUrl = new URL(url);
                updateData.title = parsedUrl.hostname.replace(/^www\./, "") + (parsedUrl.pathname !== "/" ? parsedUrl.pathname : "");
            } catch {
                updateData.title = url;
            }
        }
        if (extractedData.content) updateData.content = extractedData.content;
        if (extractedData.metadata && Object.keys(extractedData.metadata).length > 0) {
            updateData.metadata = extractedData.metadata;
        }

        await ItemModel.findByIdAndUpdate(itemId, updateData);
        console.log(`✅ Item ${itemId} saved to DB with title: "${extractedData.title}"`);

        // Only ingest to Pinecone and cluster if we have meaningful content
        if (extractedData.content && extractedData.content.trim().length > 20) {
            await ingestContent({
                itemId,
                title: extractedData.title,
                url: extractedData.url,
                content: extractedData.content,
                tags,
            });

            await assignClusterForItem(itemId, `${extractedData.title}\n${extractedData.content}`);
            console.log(`🧠 Item ${itemId} ingested to Pinecone and clustered`);
        } else {
            console.warn(`⚠️ Skipping Pinecone ingestion for ${itemId} — content too short or empty`);
        }

        console.log(`Item ${itemId} marked as processed`);
    }
}, { connection });

export default itemWorker;

