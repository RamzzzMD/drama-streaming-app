import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { melolo } from "./scraper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// API Endpoint: Home (Trending/Latest)
// Karena scraper bawaan tidak memiliki fungsi home(), kita menggunakan
// kata kunci umum seperti 'ceo' atau 'cinta' sebagai fallback data home
app.get("/api/home", async (req, res) => {
  try {
    const data = await melolo.search("ceo", 0, 15);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// API Endpoint: Search
app.get("/api/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res
        .status(400)
        .json({ success: false, message: "Query parameter 'q' is required" });
    }
    const data = await melolo.search(q, 0, 20);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// API Endpoint: Detail Drama
app.get("/api/detail/:bookId", async (req, res) => {
  try {
    const { bookId } = req.params;
    if (!bookId) {
      return res
        .status(400)
        .json({ success: false, message: "Book ID is required" });
    }
    const data = await melolo.detail(bookId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// API Endpoint: Stream Video
// Menggunakan videoId karena endpoint detail sudah mengembalikan video_id untuk setiap episode
app.get("/api/stream/:videoId", async (req, res) => {
  try {
    const { videoId } = req.params;
    if (!videoId) {
      return res
        .status(400)
        .json({ success: false, message: "Video ID is required" });
    }
    const data = await melolo.stream(videoId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
