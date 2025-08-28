import dotenv from "dotenv";
dotenv.config();
import express from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import Document from "../models/Document.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// OpenAI and Pinecone clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);

// Utility: Chunk text
function chunkText(text, chunkSize = 1200, overlap = 200) {
  const clean = text.replace(/\s+/g, " ").trim();
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

// 1️⃣ Upload PDF
router.post("/api/docs/upload", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const data = await pdfParse(req.file.buffer);
    if (!data.text.trim()) return res.status(400).json({ error: "No extractable text" });

    const chunks = chunkText(data.text);
    const embRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: chunks,
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
          chunkIndex: i,
          userId: req.user.id,
        },
      }))
    );

    const newDoc = await Document.create({
      userId: req.user.id,
      docId,
      filename: req.file.originalname,
      chunkCount: chunks.length,
      vectorIds,
    });

    res.json({ ok: true, doc: newDoc });
  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// 2️⃣ Get user's documents
router.get("/api/docs", requireAuth, async (req, res) => {
  try {
    const docs = await Document.find({ userId: req.user.id });
    res.json({ docs });
  } catch (err) {
    console.error("Fetch documents failed:", err);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

// 3️⃣ Delete document
router.delete("/api/docs/:docId", requireAuth, async (req, res) => {
  try {
    const { docId } = req.params;
    const doc = await Document.findOne({ docId, userId: req.user.id });
    if (!doc) return res.status(404).json({ error: "Document not found" });

    await index.deleteMany(doc.vectorIds);
    await Document.deleteOne({ _id: doc._id });

    res.json({ ok: true, message: "Document deleted" });
  } catch (err) {
    console.error("Delete failed:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// 4️⃣ Ask a question
router.post("/api/ask", requireAuth, async (req, res) => {
  try {
    const { question, topK = 5 } = req.body;
    if (!question) return res.status(400).json({ error: "Missing question" });

    // Create embedding for the question
    const qEmb = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: question,
    });

    // Query Pinecone filtering by userId
    const queryResp = await index.query({
      topK,
      vector: qEmb.data[0].embedding,
      includeMetadata: true,
      filter: { userId: req.user.id },
    });

    const top = queryResp.matches || [];

    // Build context for GPT
    const context = top.length
      ? top
          .map((c, idx) => `#${idx + 1} [${c.id} | ${c.metadata.filename}] ${c.metadata.text}`)
          .join("\n\n---\n\n")
      : "(No relevant context from your documents found.)";

    // GPT completion
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: `Question: ${question}\n\nContext:\n${context}` },
      ],
      temperature: 0.7,
    });

    res.json({
      answer: completion.choices[0].message.content,
      sources: top.map(c => ({
        id: c.id,
        filename: c.metadata.filename,
        score: c.score,
      })),
      usedContext: top.length > 0,
    });
  } catch (err) {
    console.error("Ask failed:", err);
    res.status(500).json({ error: "Failed to answer question" });
  }
});

export default router;
