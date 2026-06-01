import ItemModel from "../models/items.model.js";
import { queryVectors } from "../services/pinecone.service.js";
import { generateEmbeddings } from "../services/embeddings.service.js";

const MAX_EMBED_CHARS = 4000;

export async function getRelatedItems(itemId){
    const item = await ItemModel.findById(itemId);
    if(!item){
        throw new Error("Item not found");
    }

    const text = `${item.title ?? ""}\n${item.content ?? ""}`.trim().slice(0, MAX_EMBED_CHARS);
    if(!text){
        return [];
    }

    const vector = await generateEmbeddings(text);
    if(!Array.isArray(vector) || vector.length === 0){
        return [];
    }

    const matches = await queryVectors(vector, 10);

    return matches;
}