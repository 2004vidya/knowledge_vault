import { ChatMistralAI } from "@langchain/mistralai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";




const model = new ChatMistralAI({
  model: "mistral-small",
  temperature: 0,
  apiKey: process.env.MISTRAL_API_KEY,
  maxRetries: 3,
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const prompt = PromptTemplate.fromTemplate(`
You are an AI that generates concise tags.

Rules:
- Generate exactly 5 tags
- Each tag must be one word
- Lowercase only
- No explanations

Content:
{content}

Output (comma separated):
`);

const parser = new StringOutputParser();

function extractFallbackTags(text) {
  if (!text) return ["General"];
  const stopwords = new Set(["the", "a", "an", "and", "or", "in", "on", "at", "to", "for", "of", "with", "by", "from", "is", "are", "was", "were", "this", "that", "it", "full", "course", "video", "tutorial"]);
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopwords.has(w));
  const unique = Array.from(new Set(words)).slice(0, 5);
  return unique.length > 0 ? unique : ["General"];
}

export const generateTags = async (content) => {
  if (!content) return ["General"];

  const trimmedContent = content.slice(0, 2000);
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const chain = prompt.pipe(model).pipe(parser);
      const result = await chain.invoke({ content: trimmedContent });

      const tags = result
        .split(",")
        .map(tag => tag.trim().toLowerCase())
        .filter(Boolean);

      const uniqueTags = [...new Set(tags)];
      return uniqueTags.length > 0 ? uniqueTags : extractFallbackTags(content);
    } catch (error) {
      const isRateLimit = error.status === 429 || (error.message && error.message.includes("429"));
      if (isRateLimit && attempt < maxRetries) {
        const backoffMs = attempt * 1500;
        console.warn(`⏳ Mistral 429 Rate Limit hit in tag generation. Retrying in ${backoffMs}ms (attempt ${attempt}/${maxRetries})...`);
        await sleep(backoffMs);
        continue;
      }
      console.error("Tag generation error:", error.message);
      return extractFallbackTags(content);
    }
  }
  return extractFallbackTags(content);
};



