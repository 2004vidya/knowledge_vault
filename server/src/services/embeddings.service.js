import { MistralAIEmbeddings } from "@langchain/mistralai";

const embeddings = new MistralAIEmbeddings({
  apiKey: process.env.MISTRAL_API_KEY,
  maxRetries: 3,
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const generateEmbeddings = async (content) => {
  if (!content || !content.trim()) return [];
  
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const vector = await embeddings.embedQuery(content);
      return vector;
    } catch (error) {
      const isRateLimit = error.status === 429 || (error.message && error.message.includes("429"));
      if (isRateLimit && attempt < maxRetries) {
        const backoffMs = attempt * 1500;
        console.warn(`⏳ Mistral 429 Rate Limit hit. Retrying embeddings in ${backoffMs}ms (attempt ${attempt}/${maxRetries})...`);
        await sleep(backoffMs);
        continue;
      }
      console.error("Embedding generation error:", error.message || error);
      return [];
    }
  }
  return [];
};