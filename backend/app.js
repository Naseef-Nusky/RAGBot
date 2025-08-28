import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import docsRoutes from "./routes/docs.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.use("/api/auth", authRoutes);
app.use("/", docsRoutes);

app.get("/", (_req, res) => res.send("RAG Chatbot Backend Running!"));

export default app;
