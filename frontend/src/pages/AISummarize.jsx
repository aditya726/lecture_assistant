import { useState } from 'react';
import api from '../services/api';
import { BookOpen, Loader2 } from 'lucide-react';

export default function AISummarize() {
  const [text, setText] = useState('');
  const [context, setContext] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    try {
      const response = await api.post('/ai/summarize', {
        text: text,
        context: context || undefined
      });
      setResult(response.data);
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to summarize text');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-6 h-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">Text Summarization</h1>
        </div>
        <p className="text-gray-600">Get concise summaries and key points from your text</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Input</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text to Summarize *
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter the text you want to summarize..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 h-40"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Context (Optional)
              </label>
              <input
                type="text"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g., academic, technical, general"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Summarizing...
                </>
              ) : (
                'Summarize'
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
          
          {!result ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <BookOpen className="w-12 h-12 mb-3" />
              <p>Your summary will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Summary</h3>
                <p className="text-gray-900 text-sm leading-relaxed">{result.summary}</p>
              </div>

              {result.key_points && result.key_points.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Key Points</h3>
                  <ul className="space-y-1">
                    {result.key_points.map((point, index) => (
                      <li key={index} className="text-sm text-gray-900 flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
