import { useState } from 'react';
import api from '../services/api';
import { Key, Loader2 } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import { motion } from 'framer-motion';

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
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Key className="w-6 h-6 text-secondary" />
          <h1 className="text-2xl font-bold text-foreground">Extract Keywords</h1>
        </div>
        <p className="text-muted-foreground">Find important keywords and key phrases from your text</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-8">
            <h2 className="text-xl font-semibold text-foreground mb-5">Input</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Text Content *
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter the text to analyze..."
                  className="sketchy-input w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/40 h-72"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !text.trim()}
                className="sketchy-button w-full px-4 py-2 rounded-xl bg-primary text-primary-foreground border border-input hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-8">
            <h2 className="text-xl font-semibold text-foreground mb-5">Keywords</h2>
            {!result ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Key className="w-12 h-12 mb-3" />
                <p>Keywords will appear here</p>
              </div>
            ) : (
              <div className="space-y-6">
                {result.keywords && result.keywords.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Keywords</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.keywords.map((keyword, index) => (
                        <span key={index} className="px-3 py-1 rounded-full border border-input bg-card text-foreground text-sm font-medium">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.key_phrases && result.key_phrases.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Key Phrases</h3>
                    <div className="space-y-3">
                      {result.key_phrases.map((phrase, index) => (
                        <div key={index} className="p-3 rounded-lg text-sm text-foreground border border-input bg-card">
                          {phrase}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.importance_scores && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Importance</h3>
                    <div className="space-y-2">
                      {Object.entries(result.importance_scores).slice(0, 5).map(([word, score], index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-foreground">{word}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-card rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-accent rounded-full" 
                                style={{ width: `${score * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{(score * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
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
