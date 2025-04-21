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

// Langsung masukkan nilai Supabase URL & Key
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

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

    // --- LOG BROADCAST TO bclogs ---
    // Find customer_id by phone number (assuming phone is stored in E.164 format, e.g. '6281234567890')
    let customer_id = null;
    try {
      const { data: customers, error: custError } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', to)
        .maybeSingle();
      if (custError) {
        console.error('[WA SEND-TEXT] Error finding customer:', custError);
      } else if (customers && customers.id) {
        customer_id = customers.id;
      } else {
        console.warn(`[WA SEND-TEXT] No customer found for phone: ${to}`);
      }
    } catch (lookupErr) {
      console.error('[WA SEND-TEXT] Exception during customer lookup:', lookupErr);
    }
    // Only log if customer_id found
    if (customer_id) {
      const { error: logError } = await supabase
        .from('bclogs')
        .insert([{ customer_id, message: text, session }]);
      if (logError) {
        console.error('[WA SEND-TEXT] Failed to log broadcast:', logError);
      } else {
        console.log('[WA SEND-TEXT] Broadcast log saved');
      }
    } else {
      console.warn(`[WA SEND-TEXT] Broadcast not logged: customer_id not found for phone ${to}`);
    }

    res.json({ success: true, message: 'Message sent' });
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    res.status(500).json({ error: 'Failed to send message', details: error?.message });
  }
});

// Send Image
app.post('/message/send-image', multer({ storage: multer.memoryStorage() }).single('media'), async (req, res) => {
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
app.post('/message/send-video', multer({ storage: multer.memoryStorage() }).single('media'), async (req, res) => {
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
app.post('/message/send-document', multer({ storage: multer.memoryStorage() }).single('media'), async (req, res) => {
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
app.post('/message/send-voice', multer({ storage: multer.memoryStorage() }).single('media'), async (req, res) => {
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
          sessionId: msg.sessionId,
          to: msg.key.remoteJid,
          text: "Maaf, terjadi kesalahan pada server AI.",
        });
        return;
      }

      if (response && response.data && response.data.output) {
        await whatsapp.sendTextMessage({
          sessionId: msg.sessionId,
          to: msg.key.remoteJid,
          text: response.data.output,
        });
      } else {
        console.log("No response from n8n or output missing");
        await whatsapp.sendTextMessage({
          sessionId: msg.sessionId,
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

// --- Tambah endpoint broadcast WA dengan log ---
app.post('/api/wa/broadcast', async (req, res) => {
  console.log('[WA BROADCAST] Data Submit:', req.body);

  const { to, message, session } = req.body;
  console.log('[WA BROADCAST] Request:', { to, message, session });
  if (!to || !message || !session) {
    console.log('[WA BROADCAST] Error: missing parameter');
    return res.status(400).json({ error: 'Missing parameters' });
  }
  try {
    // Kirim pesan WA dengan wa-multi-session
    await whatsapp.sendTextMessage({
      sessionId: session,
      to,
      text: message,
    });
    console.log('[WA BROADCAST] Success:', { to, session });

    // --- LOG BROADCAST TO bclogs ---
    // Find customer_id by phone number (assuming phone is stored in E.164 format, e.g. '6281234567890')
    let customer_id = null;
    try {
      const { data: customers, error: custError } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', to)
        .maybeSingle();
      if (custError) {
        console.error('[WA BROADCAST] Error finding customer:', custError);
      } else if (customers && customers.id) {
        customer_id = customers.id;
      } else {
        console.warn(`[WA BROADCAST] No customer found for phone: ${to}`);
      }
    } catch (lookupErr) {
      console.error('[WA BROADCAST] Exception during customer lookup:', lookupErr);
    }

    // Only log if customer_id found
    if (customer_id) {
      const { error: logError } = await supabase
        .from('bclogs')
        .insert([{ customer_id, message, session }]);
      if (logError) {
        console.error('[WA BROADCAST] Failed to log broadcast:', logError);
      } else {
        console.log('[WA BROADCAST] Broadcast log saved');
      }
    } else {
      console.warn(`[WA BROADCAST] Broadcast not logged: customer_id not found for phone ${to}`);
    }

    res.json({ success: true, to, session });
  } catch (error) {
    console.error('[WA BROADCAST] Failed:', error);
    res.status(500).json({ error: 'Failed to send WA', details: error?.message });
  }
});
// --- END MULTI SESSION SUPPORT ---

// Endpoint untuk mencatat log broadcast WA
app.post('/api/bclogs', async (req, res) => {
  const { customer_id, message, session } = req.body;
  if (!customer_id || !message || !session) {
    return res.status(400).json({ error: 'customer_id, message, and session are required' });
  }
  const { data, error } = await supabase
    .from('bclogs')
    .insert([{ customer_id, message, session }]);
  if (error) {
    return res.status(500).json({ error: 'Failed to insert log', details: error.message });
  }
  console.log('bc berhasil di simpan di bclogs upiiiii'); // Tambah log sukses
  res.json({ success: true, data });
});

// --- Endpoint untuk data broadcast batch: ambil data broadcast sesuai tujuan utama ---
app.get('/api/databroadcastbatch/:batch_id', async (req, res) => {
  const { batch_id } = req.params;
  try {
    // Hapus validasi batch, langsung ambil orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        customer:customer_id (name, phone),
        order_items:order_items (
          qty, price,
          product:product_id (name)
        )
      `)
      .eq('batch_id', batch_id);
    if (ordersError) throw ordersError;

    // Flatten data untuk kebutuhan broadcast
    const result = [];
    orders.forEach(order => {
      (order.order_items || []).forEach(item => {
        result.push({
          name: order.customer?.name || '',
          phone: order.customer?.phone || '',
          product: item.product?.name || '',
          qty: item.qty,
          price: item.price
         
        });
      });
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || err });
  }
});
// --- END MULTI SESSION SUPPORT ---
