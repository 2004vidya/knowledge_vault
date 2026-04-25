import { Pinecone } from '@pinecone-database/pinecone'
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

 const index = pc.index("knowledge-vault");

 export const upsertVectors = async(vectors)=>{
    try {
         await index.upsert(vectors);
        
    } catch (error) {
        console.error("Upsert error:", error.message);
        return { error: error.message };
    }
 }

 export const queryVectors = async (vector, topK = 5, filter = null) => {
  try {
    const results = await index.query({
      vector,
      topK,
      includeMetadata: true,
      filter,
    });

    return results.matches;
  } catch (error) {
    console.error("Pinecone Query Error:", error);
    throw error;
  }
};


