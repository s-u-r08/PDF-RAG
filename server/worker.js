import 'dotenv/config';
import path from "path";
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { QdrantVectorStore } from "@langchain/qdrant";
import { Embeddings } from '@langchain/core/embeddings';
import { InferenceClient } from '@huggingface/inference';
import {  RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

class HuggingFaceEmbeddings extends Embeddings {

  constructor(options = {}) {
    super(options);

    this.client = new InferenceClient(
      process.env.HF_TOKEN
    );

    this.model =
      options.model ||
      'sentence-transformers/all-MiniLM-L6-v2';
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
      typeof result[0] === 'number'
    ) {
      return result;
    }


    if (
      Array.isArray(result) &&
      Array.isArray(result[0]) &&
      typeof result[0][0] === 'number'
    ) {
      return result[0];
    }


    if (
      Array.isArray(result) &&
      Array.isArray(result[0]) &&
      Array.isArray(result[0][0])
    ) {
      return result[0][0];
    }


    throw new Error(
      `Unexpected Hugging Face embedding response: ${JSON.stringify(result).slice(0, 500)}`
    );
  }
}



//Redis connection
const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

connection.on('connect', () => {
  console.log('Worker connected to Redis');
});

connection.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

//BullMQ Worker
const worker = new Worker(
  'file-upload-queue',

  async (job) => {
    console.log('Job received:', job.name);

    console.log('Job ID:', job.id);

    console.log('Job data:', job.data);

    if (job.name!=='file-ready') {
    return;  
    }

const data =
  typeof job.data === 'string'
    ? JSON.parse(job.data)
    : job.data;

const filename = data.filename;
const filePath = data.path;

console.log('Filename:', filename);
console.log('File path:', filePath);
console.log('Job data:', data);

if (!filename || !filePath) {
  throw new Error(
    `Invalid job data. Expected filename and path, received: ${JSON.stringify(data)}`
  );
}

console.log('Processing PDF:', filename);
console.log('PDF path:', filePath);

const absolutePath = path.resolve(filePath);

console.log('Absolute PDF path:', absolutePath);

const loader = new PDFLoader(absolutePath);
const docs = await loader.load();

console.log('PDF pages loaded:', docs.length);
  

  //split pdf into chunks
    const splitter=new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

    const splitDocs=await splitter.splitDocuments(docs);

    console.log( 'Chunks created:', splitDocs.length );


    if (!process.env.HF_TOKEN) {

      throw new Error(
        'HF_TOKEN is missing from .env'
      );

    }
    console.log('Creating Hugging face embeddings..')

     const embeddings =
      new HuggingFaceEmbeddings({

        model:
          'sentence-transformers/all-MiniLM-L6-v2',

      });
          console.log(
      'Testing Hugging Face embedding...'
    );


    const testEmbedding =
      await embeddings.embedQuery(
        'Hello from PDF RAG'
      );


    console.log(
      'Hugging Face embedding generated successfully'
    );


    console.log(
      'Embedding dimension:',
      testEmbedding.length
    );


    console.log('Connecting  to Qdrant...');
    await QdrantVectorStore.fromDocuments(
      splitDocs,
      embeddings,
      {
        url:process.env.QDRANT_URL,
        apiKey:process.env.QDRANT_API_KEY,
        collectionName:
        process.env.QDRANT_COLLECTION|| 'pdf_huggingface'
      }
    );
    console.log('pdf embeddings stored in Qdrant successfully');

    return {
      filename,
      pages:docs.length,
      chunks:splitDocs.length,
    };
  },
  {
    connection,
    concurrency: 1,
  }
);

worker.on('completed', (job,result) => {
  console.log(`Job ${job.id} completed`);
  console.log('Result:',result)
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

console.log('PDF Worker started')