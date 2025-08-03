require('dotenv').config();
const express = require('express');
const cloudinary = require('cloudinary').v2;
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js'); // Tambahkan ini

const app = express();

// --- Konfigurasi ---
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY
); // Tambahkan ini

app.use(cors());
app.use(express.json());

// --- Endpoint yang Sudah Ada (tetap dibutuhkan) ---
app.post('/api/generate-signature', (req, res) => {
    const timestamp = Math.round(new Date().getTime() / 1000);
    try {
        const signature = cloudinary.utils.api_sign_request({ timestamp }, process.env.CLOUDINARY_API_SECRET);
        res.status(200).json({ timestamp, signature });
    } catch (error) {
        res.status(500).json({ error: "Failed to generate signature" });
    }
});

// --- Endpoint BARU untuk menyimpan info video ---
app.post('/api/create-video-page', async (req, res) => {
    const { cloudinaryUrl } = req.body;

    if (!cloudinaryUrl) {
        return res.status(400).json({ error: 'cloudinaryUrl is required' });
    }

    // Buat ID acak (8 karakter)
    const shortId = Math.random().toString(36).substring(2, 10);
    
    // Simpan ke database Supabase
    const { data, error } = await supabase
        .from('videos')
        .insert([{ short_id: shortId, cloudinary_url: cloudinaryUrl }])
        .select();

    if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: 'Could not save video info to database.' });
    }

    // Kirim kembali ID pendeknya ke frontend
    res.status(200).json({ id: shortId });
});

// --- Endpoint BARU untuk mengambil URL video ---
app.get('/api/get-video-url', async (req, res) => {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: 'id is required' });
    }

    // Cari ID di database Supabase
    const { data, error } = await supabase
        .from('videos')
        .select('cloudinary_url')
        .eq('short_id', id)
        .single(); // .single() untuk mengambil satu baris saja

    if (error || !data) {
        console.error('Supabase error:', error);
        return res.status(404).json({ error: 'Video not found.' });
    }
    
    // Kirim kembali URL Cloudinary-nya
    res.status(200).json({ videoUrl: data.cloudinary_url });
});


module.exports = app;