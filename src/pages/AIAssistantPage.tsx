import { useState } from 'react';
import Navbar2 from '../components/Navbar2';
import { askAI } from '../services/aiService';

const AIAssistantPage = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    setLoading(true);
    setResponse('');
    try {
      const result = await askAI([{ role: 'user', content: prompt }]);
      setResponse(result);
    } catch (error) {
      setResponse('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar2 />
      <div className="container mx-auto p-6 min-h-screen text-white">
        <h1 className="text-3xl font-bold mb-6">AI Assistant</h1>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Tulis perintah atau pertanyaan ke AI..."
          className="w-full p-4 mb-4 bg-gray-800 border border-gray-600 rounded"
          rows={6}
        />
        <button
          onClick={handleAsk}
          disabled={loading || !prompt.trim()}
          className="px-6 py-3 bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-600"
        >
          {loading ? 'Memproses...' : 'Tanya AI'}
        </button>
        {response && (
          <div className="mt-6 p-4 bg-gray-800 border border-gray-600 rounded whitespace-pre-wrap">
            {response}
          </div>
        )}
      </div>
    </>
  );
};

export default AIAssistantPage;
