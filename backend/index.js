import * as whatsapp from 'wa-multi-session';
import axios from 'axios';
import express from 'express';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
dotenv.config();
import cors from 'cors';
import multer from 'multer';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import fileManagerRouter from './filemanager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Langsung masukkan nilai Supabase URL & Key
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Inisialisasi aplikasi Express
const app = express();

// Aktifkan CORS untuk semua origin dan semua metode
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: true,
}));

// Untuk preflight (OPTIONS) di semua endpoint
app.options('*', cors());

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

// Endpoint alias agar frontend bisa akses QR string
app.get('/whatsapp/qr-string/:session_id', async (req, res) => {
  const { session_id } = req.params;
  const { data, error } = await supabase.from('wa_sessions').select('last_qr').eq('session_id', session_id).single();
  if (error) return res.status(404).json({ error: 'Session not found' });
  res.json({ qr: data.last_qr });
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

// Route untuk kirim pesan teks WhatsApp (personalized, always use session 'personal')
app.post('/message/personal/send-text', async (req, res) => {
  // Always use session 'personal' for this endpoint
  const session = 'personal';
  const { to, text } = req.body;
  if (!to || !text) {
    return res.status(400).json({ error: 'to and text are required' });
  }
  try {
    await whatsapp.sendTextMessage({
      sessionId: session,
      to,
      text,
    });

    // --- LOG BROADCAST TO bclogs ---
    let customer_id = null;
    try {
      const { data: customers, error: custError } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', to)
        .maybeSingle();
      if (custError) {
        console.error('[WA PERSONAL SEND-TEXT] Error finding customer:', custError);
      } else if (customers && customers.id) {
        customer_id = customers.id;
      } else {
        console.warn(`[WA PERSONAL SEND-TEXT] No customer found for phone: ${to}`);
      }
    } catch (lookupErr) {
      console.error('[WA PERSONAL SEND-TEXT] Exception during customer lookup:', lookupErr);
    }
    // Only log if customer_id found
    if (customer_id) {
      const { error: logError } = await supabase
        .from('bclogs')
        .insert([{ customer_id, message: text, session }]);
      if (logError) {
        console.error('[WA PERSONAL SEND-TEXT] Failed to log broadcast:', logError);
      } else {
        console.log('[WA PERSONAL SEND-TEXT] Broadcast log saved');
      }
    } else {
      console.warn(`[WA PERSONAL SEND-TEXT] Broadcast not logged: customer_id not found for phone ${to}`);
    }

    res.json({ success: true, message: 'Message sent (personal session)' });
  } catch (error) {
    console.error('[WA PERSONAL SEND-TEXT] Error sending message:', error);
    res.status(500).json({ error: 'Failed to send WhatsApp message (personal session)', details: error?.message || error });
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

// Endpoint baru: Generate PDF invoice, simpan ke public/invoice, kirim pesan WA berisi ringkasan + link download
app.post('/message/send-invoice', async (req, res) => {
  // Kompatibel dengan frontend baru
  // Ambil waJid jika ada, fallback ke to
  const { sessionId, waJid, to, orderId, customerId, customerPhone, bank_account } = req.body;
  // Gunakan waJid jika ada, jika tidak fallback ke to
  let targetWa = waJid || to;
  if (typeof targetWa === 'string' && targetWa.endsWith('@c.us')) {
    targetWa = targetWa.replace('@c.us', '');
  }
  if (!sessionId || !targetWa || !orderId) {
    return res.status(400).json({ error: 'sessionId, waJid/to, and orderId are required' });
  }

  try {
    // Query order detail lengkap dari Supabase (beserta relasi customer, company, bank, batch, order_items, product)
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select(`*, company:company_id(*), customer:customer_id(*), bank_account:bank_account_id(*), batch:batch_id(*), order_items:order_items(*, product:product_id(*))`)
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return res.status(404).json({ error: 'Order not found', details: orderErr?.message });
    }

    // Gunakan data bank dari frontend jika ada, fallback ke hasil query
    const bankData = bank_account || order.bank_account || {};
    const bankName = bankData.bank_name || '-';
    const accountName = bankData.account_name || '-';
    const accountNumber = bankData.account_number || '-';

    // --- Ambil data customer dari tabel customers (bukan customer)
    const { data: customerData, error: customerErr } = await supabase
      .from('customers')
      .select('*')
      .eq('id', order.customer_id)
      .maybeSingle();
    if (customerErr) {
      console.error('Error fetching customer:', customerErr);
    }

    // --- Generate PDF invoice dan simpan ke public/invoice ---
    const filename = `invoice_${orderId}.pdf`;
    const invoiceDir = path.join(__dirname, 'public', 'invoice');
    if (!fs.existsSync(invoiceDir)) fs.mkdirSync(invoiceDir, { recursive: true });
    const filePath = path.join(invoiceDir, filename);
    const doc = new PDFDocument({ size: 'A4', margin: 20 }); // REDUCE MARGIN for smaller PDF
    doc.pipe(fs.createWriteStream(filePath));
    doc.font('Helvetica');
    doc.fontSize(20).text('INVOICE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Invoice #: ${order.invoice_no || order.id}`);
    doc.text(`Customer: ${customerData?.name || '-'}`);
    doc.text(`Phone: ${customerData?.phone || '-'}`);
    doc.text(`Address: ${customerData?.address || '-'}`);
    doc.text(`Date: ${(new Date()).toLocaleDateString('id-ID')}`);
    doc.moveDown();
    doc.text('Products:');
    (order.order_items || []).forEach((item, idx) => {
      doc.text(`${idx + 1}. ${item.product?.name || '-'} x${item.qty} @Rp${item.price}`);
    });
    doc.moveDown();
    doc.text(`Total: Rp${order.total_amount || 0}`);
    doc.moveDown();
    doc.text(`Transfer ke: ${bankName} a.n ${accountName} (${accountNumber})`);
    doc.end();

    // Setelah PDF selesai disimpan, kirim response ke client dulu
    const domain = process.env.PUBLIC_DOMAIN || 'https://wagt.satcoconut.com'; // Atur domain sesuai environment
    const downloadUrl = `${domain}/invoice/${filename}`;
    res.json({ success: true, message: 'Invoice generated', url: downloadUrl });

    // Kirim pesan WhatsApp di background
    const message =
      `Halo, berikut invoice order Anda.\n` +
      `\n` +
      `INVOICE\n` +
      `Invoice #: ${order.invoice_no || order.id}\n` +
      `Customer: ${customerData?.name || '-'}\n` +
      `Phone: ${customerData?.phone || '-'}\n` +
      `Address: ${customerData?.address || '-'}\n` +
      `Tanggal: ${(new Date()).toLocaleDateString('id-ID')}\n` +
      `\n` +
      `Produk:\n` +
      (order.order_items || []).map((item, idx) => `${idx + 1}. ${item.product?.name || '-'} x${item.qty} @Rp${item.price}`).join('\n') +
      `\nTotal: Rp${order.total_amount || 0}\n` +
      `\nTransfer ke: ${bankName} a.n ${accountName} (${accountNumber})\n` +
      `\nDownload PDF: ${downloadUrl}`;

    console.log('DEBUG: sessionId:', sessionId);
    console.log('DEBUG: to:', targetWa);
    console.log('DEBUG: message:', message);
    console.log('DEBUG: Akan kirim WA', { sessionId, to: targetWa, message });
    whatsapp.sendTextMessage({ sessionId, to: targetWa, text: message })
      .then(() => console.log('Invoice sent to WhatsApp:', targetWa))
      .catch((err) => console.error('Failed to send invoice to WhatsApp:', err));
    console.log('DEBUG: sendTextMessage dipanggil');

    // Kompres PDF di background (tidak blocking response)
    const compressedPath = filePath.replace('.pdf', '_small.pdf');
    exec(`gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.3 -dPDFSETTINGS=/screen -dNOPAUSE -dQUIET -dBATCH -sOutputFile=\"${compressedPath}\" \"${filePath}\"`, (err) => {
      if (!err && fs.existsSync(compressedPath)) {
        fs.renameSync(compressedPath, filePath);
        console.log('PDF compressed successfully:', filePath);
      } else if (err) {
        console.warn('Ghostscript compression failed:', err.message);
      }
    });
  } catch (err) {
    console.error('Error generating invoice:', err);
    res.status(500).json({ error: 'Failed to generate invoice', details: err.message });
  }
});

// Endpoint statis untuk download PDF
app.use('/invoice', express.static(path.join(__dirname, 'public', 'invoice')));

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
        response = await axios.post("https://n8n.buruh.ai/webhook/ff25ab32-6480-4265-9754-37d022f50ae4", data);
        console.log("Response from n8n:", response.data);
      } catch (n8nError) {
        console.error("Error calling n8n webhook:", n8nError?.response?.data || n8nError.message);
        await whatsapp.sendTextMessage({
          sessionId: msg.sessionId,
          to: msg.key.remoteJid,
          text: "ok ka",
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
    // Cek status session di DB
    const { data, error } = await supabase.from('wa_sessions').select('status').eq('session_id', sessionId).single();
    if (data?.status === 'connected') {
      // Jangan update QR atau tampilkan log QR jika sudah connected
      console.log(`Session ${sessionId} sudah connected, QR tidak diupdate lagi.`);
      return;
    }
    console.log(`QR Code untuk session ${sessionId}:`);
    console.log(qr);
    await supabase.from('wa_sessions').update({ last_qr: qr, status: 'pending' }).eq('session_id', sessionId);
  });

  whatsapp.onConnected(async (sessionId) => {
    console.log(`Client is ready! Session: ${sessionId}`);
    await supabase.from('wa_sessions').update({ status: 'connected', last_connected_at: new Date().toISOString() }).eq('session_id', sessionId);
  });
  // --- END PERBAIKI QR SESSION DINAMIS ---

  // whatsapp.onMessageReceived(async (msg) => {
  //   if (msg.key.fromMe) {
  //     console.log("Ignore: Message sent by me");
  //     return;
  //   }

  //   await whatsapp.readMessage({
  //     sessionId: msg.sessionId, // Use the correct session ID from wa-multi-session
  //     key: msg.key,
  //   });

  //   if (msg.key.remoteJid.includes("@g.us")) {
  //     console.log("Group message");
  //     await respond_to_message(msg);
  //   } else {
  //     console.log("Personal message");
  //     await respond_to_message(msg);
  //   }
  // });
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
        expedition,
        description,
        payment_status,
        customer:customer_id (name, phone, address),
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
          address: order.customer?.address || '',
          expedition: order.expedition || '',
          description: order.description || '',
          payment_status: order.payment_status || '',
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

// Endpoint: Ambil data broadcast batch dengan filter payment_status=unpaid
app.get('/api/databroadcastbatch_unpaid/:batch_id', async (req, res) => {
  const { batch_id } = req.params;
  try {
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        invoice_no,
        expedition,
        description,
        payment_status,
        customer:customer_id (name, phone, address),
        order_items:order_items (
          qty, price,
          product:product_id (name)
        )
      `)
      .eq('batch_id', batch_id)
      .eq('payment_status', 'unpaid');
    if (ordersError) throw ordersError;
    const result = [];
    orders.forEach(order => {
      let total = 0;
      (order.order_items || []).forEach(item => {
        total += (item.qty || 0) * (item.price || 0);
      });
      (order.order_items || []).forEach(item => {
        result.push({
          name: order.customer?.name || '',
          phone: order.customer?.phone || '',
          address: order.customer?.address || '',
          expedition: order.expedition || '',
          description: order.description || '',
          payment_status: order.payment_status || '',
          product: item.product?.name || '',
          qty: item.qty,
          price: item.price,
          invoice_no: order.invoice_no || order.id,
          total
        });
      });
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || err });
  }
});

// Endpoint: Ambil data customer (id, name, city)
app.get('/api/customers', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, city');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || err });
  }
});

// Tambah routing ke file manager
app.use('/api/files', fileManagerRouter);
