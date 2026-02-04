import { useState } from 'react';
import api from '../services/api';
import { Lightbulb, Loader2 } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import { motion } from 'framer-motion';
import MarkdownRenderer from '../components/MarkdownRenderer';

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
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-6 h-6 text-accent" />
          <h1 className="text-2xl font-bold text-foreground">Explain Doubt</h1>
        </div>
        <p className="text-muted-foreground">Get detailed explanations for your questions and doubts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-8">
            <h2 className="text-xl font-semibold text-foreground mb-5">Input</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Your Question/Doubt *
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter your question or doubt..."
                  className="sketchy-input w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 h-48"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Context (Optional)
                </label>
                <input
                  type="text"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="e.g., related topic, background info"
                  className="sketchy-input w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
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
                    Explaining...
                  </>
                ) : (
                  'Explain'
                )}
              </button>
            </form>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-8">
            <h2 className="text-xl font-semibold text-foreground mb-5">Explanation</h2>
            {!result ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Lightbulb className="w-12 h-12 mb-3" />
                <p>Your explanation will appear here</p>
              </div>
            ) : (
              <div className="space-y-6">
                {result.explanation && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Explanation</h3>
                    <div className="prose max-w-none">
                      <MarkdownRenderer content={result.explanation} />
                    </div>
                  </div>
                )}

                {result.examples && result.examples.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-white/80 mb-2">Examples</h3>
                    <ul className="space-y-3">
                      {result.examples.map((example, index) => (
                        <li key={index} className="text-sm text-foreground rounded border border-input bg-card p-3">
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.related_concepts && result.related_concepts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-white/80 mb-2">Related Concepts</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.related_concepts.map((concept, index) => (
                        <span key={index} className="px-3 py-1 rounded-full border border-input bg-card text-foreground text-sm">
                          {concept}
                        </span>
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
