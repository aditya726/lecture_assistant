import { useState } from 'react';
import api from '../services/api';
import { BarChart, Loader2 } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import { motion } from 'framer-motion';
import MarkdownRenderer from '../components/MarkdownRenderer';

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
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <BarChart className="w-6 h-6 text-red-300" />
          <h1 className="text-2xl font-bold text-white">Classify Difficulty</h1>
        </div>
        <p className="text-white/70">Assess the difficulty level of your content</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-8">
            <h2 className="text-xl font-semibold text-white mb-5">Input</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Text Content *
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter the text to analyze..."
                  className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-red-400/40 h-72"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !text.trim()}
                className="w-full px-4 py-2 rounded-xl bg-white/90 text-gray-900 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-8">
            <h2 className="text-xl font-semibold text-white mb-5">Assessment</h2>
            {!result ? (
              <div className="flex flex-col items-center justify-center h-64 text-white/50">
                <BarChart className="w-12 h-12 mb-3" />
                <p>Difficulty assessment will appear here</p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="text-center">
                  <h3 className="text-sm font-semibold text-white/80 mb-3">Difficulty Level</h3>
                  <div className={`inline-block px-6 py-3 rounded-lg border-2 text-xl font-bold ${getDifficultyColor(result.difficulty_level)}`}>
                    {result.difficulty_level?.toUpperCase()}
                  </div>
                </div>

                {result.confidence_score && (
                  <div>
                    <h3 className="text-sm font-semibold text-white/80 mb-2">Confidence</h3>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-4 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-500 rounded-full transition-all" 
                          style={{ width: `${result.confidence_score * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-white">
                        {(result.confidence_score * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}

                {result.reasoning && (
                  <div>
                    <h3 className="text-sm font-semibold text-white/80 mb-2">Reasoning</h3>
                    <div className="prose prose-invert max-w-none text-sm">
                      <MarkdownRenderer content={result.reasoning} />
                    </div>
                  </div>
                )}

                {result.factors && result.factors.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-white/80 mb-2">Contributing Factors</h3>
                    <ul className="space-y-2">
                      {result.factors.map((factor, index) => (
                        <li key={index} className="text-sm text-white flex items-start gap-2">
                          <span className="text-red-300 mt-1">•</span>
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.recommended_audience && (
                  <div>
                    <h3 className="text-sm font-semibold text-white/80 mb-2">Recommended For</h3>
                    <p className="text-sm text-white/90">{result.recommended_audience}</p>
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
