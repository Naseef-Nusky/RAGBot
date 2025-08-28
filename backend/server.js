import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import app from "./app.js";
import { connectDB } from "./config/db.js";

// --- Load .env at the very top ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });

// --- Debug: Check if env variables are loaded ---
console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY); // should print your key
console.log("PORT:", process.env.PORT);

// --- Start server in an async function ---
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

// --- Run the server ---
startServer();
