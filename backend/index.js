import * as whatsapp from 'wa-multi-session';
import axios from 'axios';

const SESSION_ID = "6281122244446";

(async () => {
  await whatsapp.startSession(SESSION_ID);

  whatsapp.onQRUpdated(({ sessionId, qr }) => {
    console.log(`QR Code untuk session ${sessionId}:`);
    console.log(qr);
  });

  whatsapp.onConnected((sessionId) => {
    // console.log(`Client is ready! Session: ${sessionId}`);
  });

  whatsapp.onMessageReceived(async (msg) => {
    if (msg.key.fromMe) {
      // console.log("Ignore: Message sent by me");
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

      let response = await axios.post("https://n8n.buruh.ai/webhook/6650951a-a439-4281-b810-d970e0b631d4", data);
      // console.log("Response from n8n", response.data.output);
      if (response.data.output) {
        await whatsapp.sendTextMessage({
          sessionId: SESSION_ID,
          to: msg.key.remoteJid,
          text: response.data.output,
        });
      } else {
        console.log("No response from n8n");
      }
    } catch (error) {
      console.error("Error sending to n8n:", error);
    }
  } else {
    console.log("No message body");
  }
};
