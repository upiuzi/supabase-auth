// Service to send WA broadcast for order confirmation
import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface BroadcastOrderConfirmPayload {
  to: string; // phone number
  message: string;
  session: string;
}

// Use /message/send-text API for CustomerDetailPage
export async function sendOrderConfirmBroadcast(payload: BroadcastOrderConfirmPayload) {
  // Use direct backend URL to avoid 404 from Vite dev server
  return axios.post(`${API_BASE_URL}/message/send-text`, {
    session: payload.session,
    to: payload.to,
    text: payload.message,
  });
}

export async function getWASessions(): Promise<{ session_id: string; status: string }[]> {
  const res = await fetch(`${API_BASE_URL}/whatsapp/sessions`);
  if (!res.ok) throw new Error('Failed to fetch WhatsApp sessions');
  return res.json();
}
