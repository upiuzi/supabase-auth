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
      <div className="container mx-auto p-6 min-h-screen bg-gray-100 text-gray-900">
        <h1 className="text-2xl font-bold mb-4">AI Assistant</h1>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Tulis perintah atau pertanyaan ke AI..."
          className="w-full p-4 mb-4 bg-white border border-gray-300 rounded text-gray-900"
          rows={6}
        />
        <button
          onClick={handleAsk}
          disabled={loading || !prompt.trim()}
          className="px-6 py-3 bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-300 text-white"
        >
          {loading ? 'Memproses...' : 'Tanya AI'}
        </button>
        {response && (
          <div className="mt-6 p-4 bg-gray-200 border border-gray-300 rounded whitespace-pre-wrap text-gray-900">
            {response}
          </div>
        )}
      </div>
    </>
  );
};

export default AIAssistantPage;
