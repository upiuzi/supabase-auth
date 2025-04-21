// Service to send WA broadcast for order confirmation
import axios from 'axios';

export interface BroadcastOrderConfirmPayload {
  to: string; // phone number
  message: string;
  session: string;
}

export async function sendOrderConfirmBroadcast(payload: BroadcastOrderConfirmPayload) {
  // Use direct backend URL to avoid 404 from Vite dev server
  return axios.post('http://localhost:3331/api/wa/broadcast', payload);
}
