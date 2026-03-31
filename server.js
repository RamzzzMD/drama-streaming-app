import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { melolo } from './scraper.js';
import axios from 'axios'; // Tambahkan axios untuk proxy gambar

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API Endpoint: Home (Trending/Latest)
// Karena scraper bawaan tidak memiliki fungsi home(), kita menggunakan
// kata kunci umum seperti 'ceo' atau 'cinta' sebagai fallback data home
app.get('/api/home', async (req, res) => {
    try {
        const data = await melolo.search('ceo', 0, 15);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// API Endpoint: Search
app.get('/api/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ success: false, message: "Query parameter 'q' is required" });
        }
        const data = await melolo.search(q, 0, 20);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// API Endpoint: Detail Drama
app.get('/api/detail/:bookId', async (req, res) => {
    try {
        const { bookId } = req.params;
        if (!bookId) {
            return res.status(400).json({ success: false, message: "Book ID is required" });
        }
        const data = await melolo.detail(bookId);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// API Endpoint: Stream Video
// Menggunakan videoId karena endpoint detail sudah mengembalikan video_id untuk setiap episode
app.get('/api/stream/:videoId', async (req, res) => {
    try {
        const { videoId } = req.params;
        if (!videoId) {
            return res.status(400).json({ success: false, message: "Video ID is required" });
        }
        const data = await melolo.stream(videoId);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// API Endpoint: Image Proxy (Bypass Hotlink Protection & CORS)
app.get('/api/image', async (req, res) => {
    let imageUrl = req.query.url;
    
    if (!imageUrl) {
        return res.status(400).send('URL is required');
    }

    // Fix: Tambahkan protokol 'https:' jika URL dari API hanya dimulai dengan '//'
    if (imageUrl.startsWith('//')) {
        imageUrl = 'https:' + imageUrl;
    }

    try {
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer', // Ambil sebagai data binary
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                'Referer': 'https://api.tmtreader.com/'
            },
            timeout: 8000 // Batas waktu 8 detik agar Vercel tidak timeout
        });

        res.set({
            'Content-Type': response.headers['content-type'] || 'image/jpeg',
            'Cache-Control': 'public, max-age=86400, s-maxage=86400'
        });

        // Fix: Langsung kirim response.data dengan res.send() 
        // Axios otomatis menjadikan response.data sebagai Buffer jika responseType-nya arraybuffer
        res.send(response.data); 
    } catch (error) {
        console.error('Proxy Image Error:', error.message);
        res.redirect(imageUrl);
    }
});

// Wajib ditambahkan: Export app agar Vercel bisa membacanya sebagai Serverless Function
export default app;

// Modifikasi bagian app.listen agar hanya berjalan di lokal
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}
