import { MistralAIEmbeddings } from "@langchain/mistralai";

const embeddings = new MistralAIEmbeddings({
  apiKey: process.env.MISTRAL_API_KEY,
});

export const generateEmbeddings = async(content)=>{
    try {
        const vector = await embeddings.embedQuery(content);
        return vector;
    } catch (error) {
        console.error("Embedding generation error:", error.message);
        return [];
    }
}