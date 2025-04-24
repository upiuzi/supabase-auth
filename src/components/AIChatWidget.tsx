import { useState } from 'react';
import { askAI } from '../services/aiService';
import { sendEmailViaWebhook } from '../services/emailWebhookService';
import { getCustomerPhoneByName } from '../services/supabaseService';
import { API_BASE_URL } from '../config';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AIChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [whatsappText, setWhatsappText] = useState('');
  const [whatsappTo, setWhatsappTo] = useState('');

  const handleAsk = async () => {
    setLoading(true);
    setEmailSubject('');
    setEmailBody('');
    setEmailTo('');
    try {
      const newMessages = [...messages, { role: 'user' as const, content: prompt }];
      setMessages(newMessages);

      const lastFive = newMessages.slice(-5);
      const result = await askAI(lastFive);
      setMessages([...newMessages, { role: 'assistant' as const, content: result }]);

      // Reset prompt
      setPrompt('');

      // Jika prompt diawali "kirim email"
      if (/^kirim email/i.test(prompt.trim())) {
        const subjectMatch = result.match(/Subject:\s*(.+)/i);
        const toMatch = prompt.match(/kirim email(?: ke)?\s+([^\s]+)/i);
        if (subjectMatch) {
          setEmailSubject(subjectMatch[1].trim());
          const body = result.split(subjectMatch[0])[1]?.trim() || '';
          setEmailBody(body);
        }
        if (toMatch) {
          setEmailTo(toMatch[1].trim());
        }
      } else {
        setEmailSubject('');
        setEmailBody('');
        setEmailTo('');
      }

      // Jika AI membalas dengan "Kirim whatsapp: ..."
      const whatsappMatch = result.match(/Kirim whatsapp:\s*(.+)/i);
      if (whatsappMatch) {
        setWhatsappText(whatsappMatch[1].trim());
        // Ambil nomor tujuan dari prompt, misal: "ke 6287878079338"
        const toMatch = prompt.match(/ke\s+(\d{8,15})/i);
        if (toMatch) {
          setWhatsappTo(toMatch[1]);
        } else {
          // Jika tidak ada nomor, cek apakah ada nama customer
          const nameMatch = prompt.match(/ke\s+([a-zA-Z0-9\s]+)/i);
          if (nameMatch) {
            const customerName = nameMatch[1].trim();
            try {
              const phone = await getCustomerPhoneByName(customerName);
              if (phone) {
                setWhatsappTo(phone);
              } else {
                setWhatsappTo('');
              }
            } catch {
              setWhatsappTo('');
            }
          } else {
            setWhatsappTo('');
          }
        }
      } else {
        setWhatsappText('');
        setWhatsappTo('');
      }
    } catch (error) {
      setMessages([...messages, { role: 'assistant', content: 'Error: ' + (error as Error).message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open ? (
        <div className="w-80 bg-gray-800 border border-gray-600 rounded-lg shadow-lg flex flex-col">
          <div className="flex justify-between items-center p-3 border-b border-gray-600">
            <h2 className="font-bold">AI Assistant</h2>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-200">&times;</button>
          </div>
          <div className="flex-1 p-3 overflow-y-auto max-h-80 flex flex-col gap-2">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-2 rounded ${
                  msg.role === 'user' ? 'bg-blue-600 self-end' : 'bg-gray-700 self-start'
                }`}
              >
                {msg.content}
              </div>
            ))}

            {emailSubject && emailTo && (
              <button
                onClick={async () => {
                  try {
                    await sendEmailViaWebhook(emailTo, emailSubject, emailBody);
                    alert('Email berhasil dikirim ke ' + emailTo);
                  } catch (error) {
                    alert('Gagal kirim email: ' + (error as Error).message);
                  }
                }}
                className="mt-2 w-full px-4 py-2 bg-green-500 rounded hover:bg-green-600"
              >
                Kirim Email Ini ke {emailTo}
              </button>
            )}

            {whatsappText && whatsappTo && (
              <button
                onClick={async () => {
                  try {
                    await fetch(`${API_BASE_URL}/send`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        sessionId: '6281122244446',
                        to: whatsappTo,
                        text: whatsappText
                      })
                    });
                    alert('Pesan WhatsApp berhasil dikirim');
                    setWhatsappText('');
                    setWhatsappTo('');
                  } catch (error) {
                    alert('Gagal kirim WhatsApp: ' + (error as Error).message);
                  }
                }}
                className="mt-2 w-full px-4 py-2 bg-green-500 rounded hover:bg-green-600"
              >
                Kirim WhatsApp ke {whatsappTo}
              </button>
            )}
          </div>
          <div className="p-3 border-t border-gray-600 flex flex-col gap-2">
            <div className="flex flex-wrap gap-2 mb-2">
              <button
                onClick={() =>
                  setPrompt('Kirim Email Penawaran produk Virgin Coconut Oil ke email@domain.com')
                }
                className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-sm"
              >
                Email Penawaran
              </button>
              <button
                onClick={() =>
                  setPrompt('Kirim Whatsapp Penawaran produk Virgin Coconut Oil ke NamaCustomer')
                }
                className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-sm"
              >
                WhatsApp Penawaran
              </button>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Tulis perintah ke AI..."
              className="w-full p-2 rounded bg-gray-700 border border-gray-600"
              rows={3}
            />
            <button
              onClick={handleAsk}
              disabled={loading || !prompt.trim()}
              className="w-full px-4 py-2 bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-600"
            >
              {loading ? 'Memproses...' : 'Kirim'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg"
        >
          AI
        </button>
      )}
    </div>
  );
};

export default AIChatWidget;
