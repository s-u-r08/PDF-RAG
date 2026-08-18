import { Embeddings } from "@langchain/core/embeddings";
import { InferenceClient } from "@huggingface/inference";

export class HuggingFaceEmbeddings extends Embeddings {

  constructor(options = {}) {
    super(options);

    if (!process.env.HF_TOKEN) {
      throw new Error("HF_TOKEN is missing in .env");
    }

    this.client = new InferenceClient(
      process.env.HF_TOKEN
    );

    this.model =
      options.model ||
      "sentence-transformers/all-MiniLM-L6-v2";
  }


  async embedDocuments(texts) {

    const embeddings = [];

    for (const text of texts) {

      const result =
        await this.client.featureExtraction({
          model: this.model,
          inputs: text,
        });

      embeddings.push(
        this.normalizeEmbedding(result)
      );
    }

    return embeddings;
  }


  async embedQuery(text) {

    const result =
      await this.client.featureExtraction({
        model: this.model,
        inputs: text,
      });

    return this.normalizeEmbedding(result);
  }


  normalizeEmbedding(result) {

   
    if (
      Array.isArray(result) &&
      typeof result[0] === "number"
    ) {
      return result;
    }


 
    if (
      Array.isArray(result) &&
      Array.isArray(result[0]) &&
      typeof result[0][0] === "number"
    ) {
      return result[0];
    }


    throw new Error(
      `Unexpected Hugging Face embedding response: ${
        JSON.stringify(result).slice(0, 500)
      }`
    );
  }
}