import dotenv from "dotenv"; 
dotenv.config();
import express from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import Document from "../models/Document.js";
import { requireAuth } from "../middleware/auth.js";
import { chunkText } from "../utils/chunkText.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);

// Upload PDF
router.post("/upload", requireAuth, upload.single("file"), async (req, res) => {
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
          userId: req.user.id
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
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// Get user documents
router.get("/", requireAuth, async (req, res) => {
  try {
    const docs = await Document.find({ userId: req.user.id });
    res.json({ docs });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

// Delete document
router.delete("/:docId", requireAuth, async (req, res) => {
  try {
    const { docId } = req.params;
    const doc = await Document.findOne({ docId, userId: req.user.id });
    if (!doc) return res.status(404).json({ error: "Not found" });

    await index.deleteMany(doc.vectorIds);
    await Document.deleteOne({ _id: doc._id });

    res.json({ ok: true, message: "Document deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

// Ask a question
router.post("/ask", requireAuth, async (req, res) => {
  try {
    const { question, topK = 5 } = req.body;
    if (!question) return res.status(400).json({ error: "Missing question" });

    const qEmb = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: question,
    });

    const queryResp = await index.query({
      topK,
      vector: qEmb.data[0].embedding,
      includeMetadata: true,
      filter: { userId: req.user.id },
    });

    const top = queryResp.matches || [];
    if (!top.length) return res.status(404).json({ error: "No relevant data found" });

    const context = top
      .map((c, idx) => `#${idx + 1} [${c.id} | ${c.metadata.filename}] ${c.metadata.text}`)
      .join("\n\n---\n\n");

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
      sources: top.map(c => ({ id: c.id, filename: c.metadata.filename, score: c.score })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to answer question" });
  }
});

export default router;
