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


export const ingestContent = async({ title, url, content, tags, itemId }) => {
  try {
    if (!content || content.trim().length === 0) {
      console.warn("Ingestion warning: content is empty for itemId:", itemId);
      return { message: "Content ingested successfully", chunks: 0 };
    }

    const chunks = await chunkText(content);
    console.log(`Chunked content into ${chunks.length} chunks for itemId:`, itemId);

    if (!chunks || chunks.length === 0) {
      console.warn("Ingestion warning: no chunks generated for itemId:", itemId);
      return { message: "Content ingested successfully", chunks: 0 };
    }

    const vectors = [];
    for (const chunk of chunks) {
      const embedding = await generateEmbeddings(chunk);
      if (!embedding || embedding.length === 0) {
        console.warn("Embedding generation failed for chunk in itemId:", itemId);
        continue;
      }

      vectors.push({
        id: uuidv4(),
        values: embedding,
        metadata: {
          title,
          url,
          content: chunk,
          tags,
          itemId: String(itemId),
        },
      });
    }

    if (vectors.length === 0) {
      console.warn("Ingestion warning: no valid vectors generated for itemId:", itemId);
      return { message: "Content ingested successfully, but no embeddings were created", chunks: chunks.length };
    }

    await upsertVectors(vectors);
    console.log(`Upserted ${vectors.length} vectors for itemId:`, itemId);

    return { message: "Content ingested successfully", chunks: chunks.length, vectors: vectors.length };
  } catch (error) {
    console.error("Ingestion error:", error.message);
    return { error: error.message };
  }
};