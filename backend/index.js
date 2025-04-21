import * as whatsapp from 'wa-multi-session';
import axios from 'axios';
import express from 'express';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
dotenv.config();
import cors from 'cors';
import multer from 'multer';
import { createCanvas } from 'canvas';
import QRCode from 'qrcode';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const upload = multer({ storage: multer.memoryStorage() });

// const SESSION_ID = "6281122244446";

// Inisialisasi aplikasi Express
const app = express();
app.use(cors()); // Aktifkan CORS untuk semua origin
app.use(express.json()); // Untuk parsing JSON body

// Tentukan port
const port = 3331;

// Route dasar untuk "Hello World"
app.get('/', (req, res) => {
  res.send('Hello World!');
});

 // Route untuk status
app.get('/status', (req, res) => {
  res.json({ status: 'ok' });
});

// Route untuk kirim pesan teks WhatsApp
// Route untuk kirim pesan teks WhatsApp
app.post('/message/send-text', async (req, res) => {
  const session = req.body.session || req.body.sessionId;
  const { to, text } = req.body;
  if (!session || !to || !text) {
    return res.status(400).json({ error: 'session/sessionId, to, and text are required' });
  }
  try {
    await whatsapp.sendTextMessage({
      sessionId: session,
      to,
      text,
    });
    res.json({ success: true, message: 'Message sent' });
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    res.status(500).json({ error: 'Failed to send message', details: error?.message });
  }
});

// Send Image
app.post('/message/send-image', upload.single('media'), async (req, res) => {
  const session = req.body.session || req.body.sessionId;
  const { to, text } = req.body;
  const media = req.file?.buffer;
  if (!session || !to || !media) {
    return res.status(400).json({ error: 'session/sessionId, to, and media are required' });
  }
  try {
    await whatsapp.sendImage({
      sessionId: session,
      to,
      text,
      media,
    });
    res.json({ success: true, message: 'Image sent' });
  } catch (error) {
    console.error('Error sending WhatsApp image:', error);
    res.status(500).json({ error: 'Failed to send image', details: error?.message });
  }
});

// Send Video
app.post('/message/send-video', upload.single('media'), async (req, res) => {
  const session = req.body.session || req.body.sessionId;
  const { to, text } = req.body;
  const media = req.file?.buffer;
  if (!session || !to || !media) {
    return res.status(400).json({ error: 'session/sessionId, to, and media are required' });
  }
  try {
    await whatsapp.sendVideo({
      sessionId: session,
      to,
      text,
      media,
    });
    res.json({ success: true, message: 'Video sent' });
  } catch (error) {
    console.error('Error sending WhatsApp video:', error);
    res.status(500).json({ error: 'Failed to send video', details: error?.message });
  }
});

// Send Document
app.post('/message/send-document', upload.single('media'), async (req, res) => {
  const session = req.body.session || req.body.sessionId;
  const { to, text } = req.body;
  const filename = req.file?.originalname;
  const media = req.file?.buffer;
  if (!session || !to || !media || !filename) {
    return res.status(400).json({ error: 'session/sessionId, to, media, and filename are required' });
  }
  try {
    await whatsapp.sendDocument({
      sessionId: session,
      to,
      filename,
      media,
      text,
    });
    res.json({ success: true, message: 'Document sent' });
  } catch (error) {
    console.error('Error sending WhatsApp document:', error);
    res.status(500).json({ error: 'Failed to send document', details: error?.message });
  }
});

// Send Voice Note
app.post('/message/send-voice', upload.single('media'), async (req, res) => {
  const session = req.body.session || req.body.sessionId;
  const { to } = req.body;
  const media = req.file?.buffer;
  if (!session || !to || !media) {
    return res.status(400).json({ error: 'session/sessionId, to, and media are required' });
  }
  try {
    await whatsapp.sendVoiceNote({
      sessionId: session,
      to,
      media,
    });
    res.json({ success: true, message: 'Voice note sent' });
  } catch (error) {
    console.error('Error sending WhatsApp voice note:', error);
    res.status(500).json({ error: 'Failed to send voice note', details: error?.message });
  }
});

// Alias endpoint: /send (untuk kompatibilitas frontend)
// Alias endpoint: /send (untuk kompatibilitas frontend)
app.post('/send', async (req, res) => {
  console.log('POST /send body:', req.body);
  const session = req.body.session || req.body.sessionId;
  const { to, text } = req.body;
  if (!session || !to || !text) {
    return res.status(400).json({ error: 'session/sessionId, to, and text are required' });
  }
  try {
    await whatsapp.sendTextMessage({
      sessionId: session,
      to,
      text,
    });
    res.json({ success: true, message: 'Message sent' });
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    res.status(500).json({ error: 'Failed to send message', details: error?.message });
  }
});

// Jalankan server Express
app.listen(port, () => {
  console.log(`Express server running with CORS enabled on port ${port}`);
  console.log(`Server running at http://localhost:${port}`);
});

// Fungsi untuk menangani pesan WhatsApp
const respond_to_message = async (msg) => {
  const messageText = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
  if (messageText) {
    let data = {
      msg: messageText,
      from: msg.key.remoteJid,
      from_name: msg.pushName || "Unknown",
    };

    console.log("Data to n8n", data);

    try {
      // Tambahkan efek typing sebelum mengirim pesan
      await whatsapp.sendTyping({
        sessionId: msg.sessionId, // Use the correct session ID from wa-multi-session
        to: msg.key.remoteJid,
        duration: 2000, // Durasi dalam milidetik (2 detik)
      });

      let response;
      try {
        response = await axios.post("https://n8n.buruh.ai/webhook/6650951a-a439-4281-b810-d970e0b631d4", data);
        console.log("Response from n8n:", response.data);
      } catch (n8nError) {
        console.error("Error calling n8n webhook:", n8nError?.response?.data || n8nError.message);
        await whatsapp.sendTextMessage({
          sessionId: msg.sessionId, // Use the correct session ID from wa-multi-session
          to: msg.key.remoteJid,
          text: "Maaf, AI sedang tidak tersedia. Silakan coba lagi nanti.",
        });
        return;
      }

      if (response.data && response.data.output) {
        await whatsapp.sendTextMessage({
          sessionId: msg.sessionId, // Use the correct session ID from wa-multi-session
          to: msg.key.remoteJid,
          text: response.data.output,
        });
      } else {
        console.log("No response from n8n or output missing");
        await whatsapp.sendTextMessage({
          sessionId: msg.sessionId, // Use the correct session ID from wa-multi-session
          to: msg.key.remoteJid,
          text: "Maaf, tidak ada balasan dari AI.",
        });
      }
    } catch (error) {
      console.error("Error in respond_to_message:", error);
    }
  } else {
    console.log("No message body");
  }
};

// --- LOAD SAVED WA SESSIONS ON STARTUP ---
whatsapp.loadSessionsFromStorage();

// Inisialisasi sesi WhatsApp
(async () => {
  // await whatsapp.startSession(SESSION_ID);

  // --- PERBAIKI QR SESSION DINAMIS ---
  // Simpan QR code ke DB untuk session dinamis
  whatsapp.onQRUpdated(async ({ sessionId, qr }) => {
    console.log(`QR Code untuk session ${sessionId}:`);
    console.log(qr);
    // Simpan/update QR di wa_sessions
    await supabase.from('wa_sessions').update({ last_qr: qr, status: 'pending' }).eq('session_id', sessionId);
  });

  whatsapp.onConnected(async (sessionId) => {
    console.log(`Client is ready! Session: ${sessionId}`);
    await supabase.from('wa_sessions').update({ status: 'connected', last_connected_at: new Date().toISOString() }).eq('session_id', sessionId);
  });
  // --- END PERBAIKI QR SESSION DINAMIS ---

  whatsapp.onMessageReceived(async (msg) => {
    if (msg.key.fromMe) {
      console.log("Ignore: Message sent by me");
      return;
    }

    await whatsapp.readMessage({
      sessionId: msg.sessionId, // Use the correct session ID from wa-multi-session
      key: msg.key,
    });

    if (msg.key.remoteJid.includes("@g.us")) {
      console.log("Group message");
      await respond_to_message(msg);
    } else {
      console.log("Personal message");
      await respond_to_message(msg);
    }
  });
})();

// --- MULTI SESSION WA SUPPORT ---
// List all WA sessions
app.get('/whatsapp/sessions', async (req, res) => {
  const { data, error } = await supabase.from('wa_sessions').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Start session (generate QR)
app.post('/whatsapp/start-session', async (req, res) => {
  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ error: 'session_id required' });
  try {
    await whatsapp.startSession(session_id);
    res.json({ message: 'Session started, scan QR' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get QR for a session
app.get('/whatsapp/qr/:session_id', async (req, res) => {
  const { session_id } = req.params;
  const { data, error } = await supabase.from('wa_sessions').select('last_qr').eq('session_id', session_id).single();
  if (error) return res.status(404).json({ error: 'Session not found' });
  res.json({ qr: data.last_qr });
});

// Get status for a session
app.get('/whatsapp/status/:session_id', async (req, res) => {
  const { session_id } = req.params;
  const { data, error } = await supabase.from('wa_sessions').select('status').eq('session_id', session_id).single();
  if (error) return res.status(404).json({ error: 'Session not found' });
  res.json({ connected: data.status === 'connected' });
});

// --- CREATE SESSION ENDPOINT ---
// Tambah session baru ke wa_sessions
app.post('/whatsapp/create-session', async (req, res) => {
  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ error: 'session_id required' });
  // Cek apakah session sudah ada
  const { data: existing, error: errExist } = await supabase.from('wa_sessions').select('session_id').eq('session_id', session_id).single();
  if (existing) return res.status(400).json({ error: 'Session sudah ada' });
  // Insert session baru
  const { data, error } = await supabase.from('wa_sessions').insert([{ session_id, status: 'new', last_qr: null }]);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, session_id });
});
// --- END CREATE SESSION ENDPOINT ---

// --- DELETE SESSION ENDPOINT ---
// Hapus session dari wa_sessions
app.delete('/whatsapp/delete-session/:session_id', async (req, res) => {
  const { session_id } = req.params;
  if (!session_id) return res.status(400).json({ error: 'session_id required' });
  // Hapus session dari DB
  const { error } = await supabase.from('wa_sessions').delete().eq('session_id', session_id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});
// --- END DELETE SESSION ENDPOINT ---

// --- QR IMAGE ENDPOINT ---
// Convert last_qr ke image/png base64 jika belum, dan serve sebagai data:image/png
app.get('/whatsapp/qr-image/:session_id', async (req, res) => {
  const { session_id } = req.params;
  const { data, error } = await supabase.from('wa_sessions').select('last_qr').eq('session_id', session_id).single();
  if (error || !data || !data.last_qr) return res.status(404).json({ error: 'QR not found' });
  try {
    const canvas = createCanvas(300, 300);
    await QRCode.toCanvas(canvas, data.last_qr);
    const imgData = canvas.toDataURL().replace(/^data:image\/png;base64,/, '');
    res.json({ qr: imgData });
  } catch (e) {
    res.status(500).json({ error: 'Failed to generate QR', details: e.message });
  }
});
// --- END QR IMAGE ENDPOINT ---

// --- END MULTI SESSION SUPPORT ---
