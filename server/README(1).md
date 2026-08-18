# Build AI Chat with App

## Project Overview

Build AI Chat with App is an AI-powered PDF chat application that allows users to upload PDF documents and ask questions based on their content. The application uses a RAG-based approach with vector embeddings and Qdrant to retrieve relevant information from uploaded documents.

## Features

- PDF document upload
- AI-powered chat with uploaded PDFs
- RAG-based question answering
- Semantic search using vector embeddings
- Relevant document retrieval using Qdrant
- Background PDF processing using BullMQ and Redis
- Hugging Face embeddings
- LangChain integration
- Frontend authentication using Clerk
- Express.js backend for APIs
- Multer for PDF/file uploads

## Tech Stack

### Frontend
- Next.js
- React
- Clerk

### Backend
- Node.js
- Express.js
- Multer

### AI / RAG
- LangChain
- Hugging Face

### Vector Database
- Qdrant

### Queue & Background Processing
- Redis
- BullMQ

## Project Structure

```text
Build-AI-Chat-with-App/
│
├── client/
│   ├── app/
│   │   ├── components/
│   │   │   ├── chat.tsx
│   │   │   └── file-upload...
│   │   ├── sign-in/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   │
│   ├── public/
│   ├── components.json
│   ├── next.config.ts
│   ├── package.json
│   └── ...
│
├── server/
│   ├── uploads/
│   ├── hf-embeddings.js
│   ├── index.js
│   ├── worker.js
│   ├── package.json
│   └── ...
│
└── README.md
```
