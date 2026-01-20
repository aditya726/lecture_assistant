import { useState } from 'react';
import api from '../services/api';
import { Lightbulb, Loader2 } from 'lucide-react';

export default function AIExplain() {
  const [text, setText] = useState('');
  const [context, setContext] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    try {
      const response = await api.post('/ai/explain-doubt', {
        text: text,
        context: context || undefined
      });
      setResult(response.data);
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to explain doubt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">Explain Doubt</h1>
        </div>
        <p className="text-gray-600">Get detailed explanations for your questions and doubts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Input</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Question/Doubt *
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter your question or doubt..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 h-40"
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
                placeholder="e.g., related topic, background info"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Explaining...
                </>
              ) : (
                'Explain'
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Explanation</h2>
          
          {!result ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Lightbulb className="w-12 h-12 mb-3" />
              <p>Your explanation will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Explanation</h3>
                <p className="text-gray-900 text-sm leading-relaxed">{result.explanation}</p>
              </div>

              {result.examples && result.examples.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Examples</h3>
                  <ul className="space-y-2">
                    {result.examples.map((example, index) => (
                      <li key={index} className="text-sm text-gray-900 bg-purple-50 p-3 rounded">
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.related_concepts && result.related_concepts.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Related Concepts</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.related_concepts.map((concept, index) => (
                      <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
