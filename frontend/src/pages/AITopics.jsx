import { useState } from 'react';
import api from '../services/api';
import { Tag, Loader2 } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import { motion } from 'framer-motion';

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
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Tag className="w-6 h-6 text-orange-300" />
          <h1 className="text-2xl font-bold text-white">Extract Topics</h1>
        </div>
        <p className="text-white/70">Identify main topics and themes from your content</p>
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
                  className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-orange-400/40 h-72"
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
                    Extracting...
                  </>
                ) : (
                  'Extract Topics'
                )}
              </button>
            </form>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-8">
            <h2 className="text-xl font-semibold text-white mb-5">Topics</h2>
            {!result ? (
              <div className="flex flex-col items-center justify-center h-64 text-white/50">
                <Tag className="w-12 h-12 mb-3" />
                <p>Topics will appear here</p>
              </div>
            ) : (
              <div className="space-y-6">
                {result.topics && result.topics.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-white/80 mb-2">Main Topics</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.topics.map((topic, index) => (
                        <span key={index} className="px-4 py-2 rounded-lg border border-white/10 bg-white/10 text-white/90 text-sm font-medium">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.subtopics && result.subtopics.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-white/80 mb-2">Subtopics</h3>
                    <div className="space-y-3">
                      {result.subtopics.map((subtopic, index) => (
                        <div key={index} className="p-3 rounded-lg text-sm text-white/90 border border-white/10 bg-white/5">
                          {subtopic}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.confidence && (
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-sm text-white/70">
                      Confidence: <span className="font-semibold text-white">{result.confidence}</span>
                    </p>
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
