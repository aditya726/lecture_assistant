import { useState } from 'react';
import api from '../services/api';
import { Tag, Loader2 } from 'lucide-react';

export default function AITopics() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    try {
      const response = await api.post('/ai/extract-topics', { text: text });
      setResult(response.data);
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to extract topics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Tag className="w-6 h-6 text-orange-600" />
          <h1 className="text-2xl font-bold text-gray-900">Extract Topics</h1>
        </div>
        <p className="text-gray-600">Identify main topics and themes from your content</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Input</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text Content *
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter the text to analyze..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 h-64"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                'Extract Topics'
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Topics</h2>
          
          {!result ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Tag className="w-12 h-12 mb-3" />
              <p>Topics will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {result.topics && result.topics.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Main Topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.topics.map((topic, index) => (
                      <span key={index} className="px-4 py-2 bg-orange-100 text-orange-700 text-sm font-medium rounded-lg">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.subtopics && result.subtopics.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Subtopics</h3>
                  <div className="space-y-2">
                    {result.subtopics.map((subtopic, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm text-gray-900">
                        {subtopic}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.confidence && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Confidence: <span className="font-semibold">{result.confidence}</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
