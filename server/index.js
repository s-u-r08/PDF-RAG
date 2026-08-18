import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { QdrantVectorStore } from "@langchain/qdrant";
import { HuggingFaceEmbeddings } from "./hf-embeddings.js";

const connection = new IORedis(process.env.REDIS_URL);

connection.on('connect', () => {
  console.log('Connected to Cloud Redis');
});

connection.on('error', (err) => {
  console.error('Redis Error:', err.message);
});

const queue = new Queue('file-upload-queue', {
  connection,
});


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },

  filename: function (req, file, cb) {
    const uniqueSuffix =
      Date.now() + '-' + Math.round(Math.random() * 1E9);

    cb(
      null,
      `${uniqueSuffix}-${file.originalname}`
    );
  }
});

const upload = multer({
  storage: storage
});

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.get('/', (req, res) => {
  return res.json({
    status: 'All Good!'
  });
});

app.post(
  '/upload/pdf',
  upload.single('pdf'),
  async (req, res) => {
    try {
      console.log('Uploaded file:', req.file);

      if (!req.file) {
        return res.status(400).json({
          message: 'No PDF file uploaded',
        });
      }

      await queue.add('file-ready', {
        filename: req.file.originalname,
        destination: req.file.destination,
        path: req.file.path,
      });

      return res.status(200).json({
        message: 'File uploaded successfully',
        filename: req.file.originalname,
      });

    } catch (error) {
      console.error('Upload error:', error);

      return res.status(500).json({
        message: 'Internal Server Error',
      });
    }
  }
);

app.get('/chat',async(req,res)=>{
 
 try{
   const userQuery=req.query.q;
   if (!userQuery) {

        return res.status(400).json({

          message:
            "Please provide query using ?q=",

        });

      }
      console.log(" Query:",userQuery);

        const embeddings =
        new HuggingFaceEmbeddings({

          model:
            "sentence-transformers/all-MiniLM-L6-v2",

        }
   )

   //Connect qdrant collection
   const vectorStore=await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url:process.env.QDRANT_URL,
      apiKey:process.env.QDRANT_API_KEY,
      collectionName:process.env.QDRANT_COLLECTION||'pdf_huggingface',
    }
   );
   console.log("Connected to Qdrant");

   //create retriever
   const retriever =vectorStore.asRetriever({
    k: 2,
 });
 const result=await retriever.invoke(userQuery);
 console.log('Retrieved documents:',result.length)

 return res.json({
 query:userQuery,
 result: result.map((doc) => ({
pageContent:doc.pageContent,
metadata:doc.metadata,
 })),

});
 } 
catch (error) {
console.error("Chat Error:",error);
return res.status(500).json({
message:"Error while searching PDF",
error:error.message,
});
}
});

app.listen(8000, () => {
  console.log('Server started on PORT:8000');
});