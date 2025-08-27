import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env in the same directory
dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Use memory storage for Vercel compatibility
const storage = multer.memoryStorage();
const upload = multer({ storage });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'rag-index';
const index = pinecone.Index(INDEX_NAME);

// In-memory storage for document metadata (in production, use a database)
const documentStore = new Map();

function chunkText(text, chunkSize = 1200, overlap = 200) {
  const clean = text.replace(/\s+/g, ' ').trim();
  const chunks = [];
  let i = 0;
  while (i < clean.length) {
    const end = Math.min(i + chunkSize, clean.length);
    chunks.push(clean.slice(i, end));
    if (end === clean.length) break;
    i = end - overlap;
  }
  return chunks;
}

// 1) Upload PDF → store embeddings
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Use buffer instead of file system for Vercel compatibility
    const data = await pdfParse(req.file.buffer);
    const text = data.text || '';
    if (!text.trim()) return res.status(400).json({ error: 'PDF has no extractable text' });

    const chunks = chunkText(text);

    const embRes = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: chunks
    });

    const vectors = embRes.data.map(d => d.embedding);
    const docId = `${Date.now()}-${req.file.originalname}`;
    const vectorIds = chunks.map((_, i) => `${docId}#${i}`);

    await index.upsert(
      chunks.map((chunk, i) => ({
        id: vectorIds[i],
        values: vectors[i],
        metadata: { 
          text: chunk, 
          filename: req.file.originalname, 
          docId,
          chunkIndex: i 
        }
      }))
    );

    // Store document metadata
    documentStore.set(docId, {
      docId,
      filename: req.file.originalname,
      chunkCount: chunks.length,
      vectorIds,
      uploadedAt: new Date().toISOString()
    });

    res.json({ 
      ok: true, 
      docId, 
      chunks: chunks.length,
      filename: req.file.originalname
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to ingest PDF' });
  }
});

// 2) Ask a question → query Pinecone → OpenAI answer
app.post('/api/ask', async (req, res) => {
  try {
    const { question, topK = 5 } = req.body || {};
    if (!question) return res.status(400).json({ error: 'Missing question' });

    const qEmb = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: question
    });
    const qVec = qEmb.data[0].embedding;

    const queryResp = await index.query({
      topK,
      vector: qVec,
      includeMetadata: true
    });

    const top = queryResp.matches || [];
    if (!top.length) return res.status(400).json({ error: 'No relevant data found' });

    const context = top
      .map((c, idx) => `#${idx + 1} [${c.id} | ${c.metadata.filename}] ${c.metadata.text}`)
      .join('\n\n---\n\n');

    const systemPrompt = `
    You are a helpful assistant. 
    Use the provided Context to answer the user's question, but you may also draw on your general knowledge 
    to provide a complete and accurate answer if the context is insufficient.
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Question: ${question}\n\nContext:\n${context}` }
      ],
      temperature: 0.7
    });

    res.json({
      answer: completion.choices[0].message.content,
      sources: top.map(c => ({
        id: c.id,
        filename: c.metadata.filename,
        score: c.score,
        docId: c.metadata.docId
      }))
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to answer question' });
  }
});

// 3) Get all documents
app.get('/api/docs', async (_req, res) => {
  try {
    // Fetch all vectors (adjust topK to max vectors expected)
    const resp = await index.query({
      vector: Array(1536).fill(0), // dummy vector
      topK: 1000,
      includeMetadata: true
    });

    const docsMap = new Map();

    (resp.matches || []).forEach((match) => {
      const { docId, filename } = match.metadata;
      if (!docsMap.has(docId)) {
        docsMap.set(docId, {
          docId,
          filename,
          vectorIds: [match.id],
          uploadedAt: new Date().toISOString(),
        });
      } else {
        docsMap.get(docId).vectorIds.push(match.id);
      }
    });

    res.json({ docs: Array.from(docsMap.values()) });
  } catch (err) {
    console.error("Fetch docs error:", err);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

// 4) Delete a document and its vectors
app.delete('/api/docs/:docId', async (req, res) => {
  try {
    const { docId } = req.params;

    // Query Pinecone for all vectors with this docId
    const queryResp = await index.query({
      vector: Array(1536).fill(0), // dummy vector for query
      topK: 1000,
      includeMetadata: true,
    });

    const vectorsToDelete = (queryResp.matches || [])
      .filter((v) => v.metadata.docId === docId)
      .map((v) => v.id);

    if (!vectorsToDelete.length) {
      return res.status(404).json({ error: 'Document not found in Pinecone' });
    }

    // Delete all vectors for this document
    await index.deleteMany(vectorsToDelete);

    // Optionally remove from documentStore if still present
    documentStore.delete(docId);

    res.json({
      ok: true,
      message: `Document ${docId} deleted successfully`,
      deletedVectors: vectorsToDelete.length,
    });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// 5) Get document details with chunks
app.get('/api/docs/:docId', async (req, res) => {
  try {
    const { docId } = req.params;
    
    if (!documentStore.has(docId)) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = documentStore.get(docId);
    
    // Fetch all chunks for this document
    const fetched = await index.fetch({ ids: doc.vectorIds });
    
    const chunks = Object.values(fetched.records || {}).map(record => ({
      id: record.id,
      text: record.metadata.text,
      chunkIndex: record.metadata.chunkIndex,
      score: null // No score for direct fetch
    })).sort((a, b) => a.chunkIndex - b.chunkIndex);

    res.json({
      doc: {
        ...doc,
        chunks
      }
    });

  } catch (err) {
    console.error("Get document error:", err);
    res.status(500).json({ error: "Failed to fetch document details" });
  }
});

export default app;
// Always start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
