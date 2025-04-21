// Service to send WA broadcast for order confirmation
import axios from 'axios';

export interface BroadcastOrderConfirmPayload {
  to: string; // phone number
  message: string;
  session: string;
}

// Use /message/send-text API for CustomerDetailPage
export async function sendOrderConfirmBroadcast(payload: BroadcastOrderConfirmPayload) {
  // Use direct backend URL to avoid 404 from Vite dev server
  return axios.post('http://localhost:3331/message/send-text', {
    session: payload.session,
    to: payload.to,
    text: payload.message,
  });
}

export async function getWASessions(): Promise<{ session_id: string; status: string }[]> {
  const res = await fetch('http://localhost:3331/whatsapp/sessions');
  if (!res.ok) throw new Error('Failed to fetch WhatsApp sessions');
  return res.json();
}
