import { ChatMistralAI } from "@langchain/mistralai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";




const model = new ChatMistralAI({
  model: "mistral-small",
  temperature: 0,
  apiKey: process.env.MISTRAL_API_KEY
});





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

export const generateTags = async (content) => {
  try {
    if (!content) return [];

    const trimmedContent = content.slice(0, 2000);

    const chain = prompt.pipe(model).pipe(parser);

    const result = await chain.invoke({
      content: trimmedContent
    });

    const tags = result
      .split(",")
      .map(tag => tag.trim().toLowerCase())
      .filter(Boolean);

    return [...new Set(tags)];

    

   
    

  } catch (error) {
    console.error("Tag generation error:", error.message);
    return [];
  }
};



