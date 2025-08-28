import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  docId: { type: String, required: true },
  filename: { type: String, required: true },
  chunkCount: Number,
  vectorIds: [String],
  uploadedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Document", documentSchema);
