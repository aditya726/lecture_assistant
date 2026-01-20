import { useState } from 'react';
import api from '../services/api';
import { Key, Loader2 } from 'lucide-react';

export default function AIKeywords() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    try {
      const response = await api.post('/ai/extract-keywords', { text: text });
      setResult(response.data);
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to extract keywords');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Key className="w-6 h-6 text-pink-600" />
          <h1 className="text-2xl font-bold text-gray-900">Extract Keywords</h1>
        </div>
        <p className="text-gray-600">Find important keywords and key phrases from your text</p>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 h-64"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                'Extract Keywords'
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Keywords</h2>
          
          {!result ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Key className="w-12 h-12 mb-3" />
              <p>Keywords will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {result.keywords && result.keywords.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.keywords.map((keyword, index) => (
                      <span key={index} className="px-3 py-1 bg-pink-100 text-pink-700 text-sm font-medium rounded-full">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.key_phrases && result.key_phrases.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Key Phrases</h3>
                  <div className="space-y-2">
                    {result.key_phrases.map((phrase, index) => (
                      <div key={index} className="p-3 bg-pink-50 rounded-lg text-sm text-gray-900">
                        {phrase}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.importance_scores && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Importance</h3>
                  <div className="space-y-2">
                    {Object.entries(result.importance_scores).slice(0, 5).map(([word, score], index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-900">{word}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-pink-600 rounded-full" 
                              style={{ width: `${score * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">{(score * 100).toFixed(0)}%</span>
                        </div>
                      </div>
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
