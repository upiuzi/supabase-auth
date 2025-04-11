import * as whatsapp from 'wa-multi-session';
import axios from 'axios';
import express from 'express';
import cors from 'cors';

const SESSION_ID = "6281122244446";

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
        sessionId: SESSION_ID,
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
          sessionId: SESSION_ID,
          to: msg.key.remoteJid,
          text: "Maaf, AI sedang tidak tersedia. Silakan coba lagi nanti.",
        });
        return;
      }

      if (response.data && response.data.output) {
        await whatsapp.sendTextMessage({
          sessionId: SESSION_ID,
          to: msg.key.remoteJid,
          text: response.data.output,
        });
      } else {
        console.log("No response from n8n or output missing");
        await whatsapp.sendTextMessage({
          sessionId: SESSION_ID,
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

// Inisialisasi sesi WhatsApp
(async () => {
  await whatsapp.startSession(SESSION_ID);

  whatsapp.onQRUpdated(({ sessionId, qr }) => {
    console.log(`QR Code untuk session ${sessionId}:`);
    console.log(qr);
  });

  whatsapp.onConnected((sessionId) => {
    console.log(`Client is ready! Session: ${sessionId}`);
  });

  whatsapp.onMessageReceived(async (msg) => {
    if (msg.key.fromMe) {
      console.log("Ignore: Message sent by me");
      return;
    }

    await whatsapp.readMessage({
      sessionId: SESSION_ID,
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
