const OPENROUTER_API_KEY = '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';

export async function askAI(messages: { role: 'user' | 'assistant' | 'system'; content: string }[]): Promise<string> {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://yourapp.example.com',
        'X-Title': 'Your App AI Assistant'
      },
      body: JSON.stringify({
        model: 'openrouter/optimus-alpha',
        messages: [
          { role: 'system', content: `You are an AI assistant that helps generate email drafts and WhatsApp messages.
When the user asks to send an email, always generate a full professional email draft with subject and body, in the requested language.
Do not say you cannot send emails.
Always use this signature at the end of the email:

Upi
Marketing Director
SAT Coconut
Website: satcoconut.com
Email: upi@satcoconut.com
Phone: +6281122244446

When the user asks to send a WhatsApp message, always reply ONLY with the message in this format:
Kirim whatsapp: [the message content]
Do not add any other explanation or draft, just output exactly in that format.
` },
          ...messages
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`OpenRouter API error: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error calling OpenRouter API:', error);
    throw error;
  }
}
