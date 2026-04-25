import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { generateEmbeddings } from "./embeddings.service.js";
import { upsertVectors } from "./pinecone.service.js";
import { v4 as uuidv4 } from "uuid";

const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 100, chunkOverlap: 0 })


const chunkText = async(text)=>{
    try {
        const chunks = await splitter.splitText(text);
        return chunks;
    } catch (error) {
        console.error("Chunking error:", error.message);
        return [];
    }
}


export const ingestContent = async({ title, url, content, tags })=>{
    try {

        const chunks = await chunkText(content);

        const vectors =[];
         for (const chunk of chunks) {
      const embedding = await generateEmbeddings(chunk);

      vectors.push({
        id: uuidv4(),
        values: embedding,
        metadata: {
          title,
          url,
          content: chunk,
          tags,
        },
      });
    }

     await upsertVectors(vectors);

    return { message: "Content ingested successfully", chunks: chunks.length };
        
    } catch (error) {
        console.error("Ingestion error:", error.message);
        return { error: error.message };
    }
}