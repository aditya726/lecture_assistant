import { useState } from 'react';
import api from '../services/api';
import { BarChart, Loader2 } from 'lucide-react';

export default function AIDifficulty() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    try {
      const response = await api.post('/ai/classify-difficulty', { text: text });
      setResult(response.data);
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to classify difficulty');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (level) => {
    const colors = {
      'beginner': 'bg-green-100 text-green-700 border-green-200',
      'easy': 'bg-green-100 text-green-700 border-green-200',
      'intermediate': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'medium': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'advanced': 'bg-orange-100 text-orange-700 border-orange-200',
      'hard': 'bg-red-100 text-red-700 border-red-200',
      'expert': 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[level?.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <BarChart className="w-6 h-6 text-red-600" />
          <h1 className="text-2xl font-bold text-gray-900">Classify Difficulty</h1>
        </div>
        <p className="text-gray-600">Assess the difficulty level of your content</p>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 h-64"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Classify Difficulty'
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Assessment</h2>
          
          {!result ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <BarChart className="w-12 h-12 mb-3" />
              <p>Difficulty assessment will appear here</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Difficulty Level</h3>
                <div className={`inline-block px-6 py-3 rounded-lg border-2 text-xl font-bold ${getDifficultyColor(result.difficulty_level)}`}>
                  {result.difficulty_level?.toUpperCase()}
                </div>
              </div>

              {result.confidence_score && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Confidence</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-600 rounded-full transition-all" 
                        style={{ width: `${result.confidence_score * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {(result.confidence_score * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}

              {result.reasoning && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Reasoning</h3>
                  <p className="text-sm text-gray-900 leading-relaxed bg-gray-50 p-4 rounded-lg">
                    {result.reasoning}
                  </p>
                </div>
              )}

              {result.factors && result.factors.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Contributing Factors</h3>
                  <ul className="space-y-1">
                    {result.factors.map((factor, index) => (
                      <li key={index} className="text-sm text-gray-900 flex items-start gap-2">
                        <span className="text-red-600 mt-1">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.recommended_audience && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Recommended For</h3>
                  <p className="text-sm text-gray-900">{result.recommended_audience}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
