// Broadcast sender: panggil backend API sesuai tipe pesan

const BASE_URL = 'http://localhost:3331'; // Ganti jika backend berjalan di host/port berbeda

export async function sendBroadcast(phone: string, message: string, sessionId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/message/send-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, to: phone, text: message }),
  });
  if (!res.ok) {
    let errorMsg = 'Failed to send message';
    try {
      const error = await res.json();
      errorMsg = error?.error || error?.message || errorMsg;
    } catch (e) {
      // JSON parse failed, keep default
    }
    throw new Error(errorMsg);
  }
}

export async function sendBroadcastImage(phone: string, file: File, caption = '', sessionId: string): Promise<void> {
  const formData = new FormData();
  formData.append('sessionId', sessionId);
  formData.append('to', phone);
  formData.append('text', caption);
  formData.append('media', file);

  const res = await fetch(`${BASE_URL}/message/send-image`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    let errorMsg = 'Failed to send image';
    try {
      const error = await res.json();
      errorMsg = error?.error || error?.message || errorMsg;
    } catch (e) {}
    throw new Error(errorMsg);
  }
}

export async function sendBroadcastVideo(phone: string, file: File, caption = '', sessionId: string): Promise<void> {
  const formData = new FormData();
  formData.append('sessionId', sessionId);
  formData.append('to', phone);
  formData.append('text', caption);
  formData.append('media', file);

  const res = await fetch(`${BASE_URL}/message/send-video`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    let errorMsg = 'Failed to send video';
    try {
      const error = await res.json();
      errorMsg = error?.error || error?.message || errorMsg;
    } catch (e) {}
    throw new Error(errorMsg);
  }
}

export async function sendBroadcastDocument(phone: string, file: File, caption = '', sessionId: string): Promise<void> {
  const formData = new FormData();
  formData.append('sessionId', sessionId);
  formData.append('to', phone);
  formData.append('text', caption);
  formData.append('media', file);

  const res = await fetch(`${BASE_URL}/message/send-document`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    let errorMsg = 'Failed to send document';
    try {
      const error = await res.json();
      errorMsg = error?.error || error?.message || errorMsg;
    } catch (e) {}
    throw new Error(errorMsg);
  }
}

export async function sendBroadcastVoice(phone: string, file: File, sessionId: string): Promise<void> {
  const formData = new FormData();
  formData.append('sessionId', sessionId);
  formData.append('to', phone);
  formData.append('media', file);

  const res = await fetch(`${BASE_URL}/message/send-voice`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    let errorMsg = 'Failed to send voice note';
    try {
      const error = await res.json();
      errorMsg = error?.error || error?.message || errorMsg;
    } catch (e) {}
    throw new Error(errorMsg);
  }
}
