require('dotenv').config();
const express = require('express');
const cloudinary = require('cloudinary').v2;
const cors = require('cors');
const app = express();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

app.use(cors()); // Izinkan semua koneksi
app.use(express.json());

app.post('/api/generate-signature', (req, res) => {
    const timestamp = Math.round(new Date().getTime() / 1000);
    try {
        const signature = cloudinary.utils.api_sign_request(
            { timestamp: timestamp },
            process.env.CLOUDINARY_API_SECRET
        );
        res.status(200).json({ timestamp, signature });
    } catch (error) {
        res.status(500).json({ error: "Failed to generate signature" });
    }
});

// Tangani root GET untuk membuktikan server hidup
app.get('/', (req, res) => {
  res.status(200).send('Backend Videy Aktif!');
});

module.exports = app;