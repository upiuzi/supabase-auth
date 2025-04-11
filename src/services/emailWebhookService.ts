const WEBHOOK_URL = 'https://n8n.buruh.ai/webhook/aiemailsat';

export async function sendEmailViaWebhook(to: string, subject: string, body: string) {
  try {
    // Bersihkan kata "Test" di subject dan body
    const cleanSubject = subject.replace(/test/gi, '').trim();
    const cleanBody = body.replace(/test/gi, '').trim();

    // Convert body ke HTML (ganti linebreak jadi <br>)
    const htmlBody = cleanBody.replace(/\n/g, '<br>');

    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to,
        subject: cleanSubject,
        body: htmlBody
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Webhook error: ${res.status} ${errorText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error sending email via webhook:', error);
    throw error;
  }
}
