import { useState, useEffect } from 'react';
import api from '../services/api';
import { Zap, Plus, Loader2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MicronotesPanel({ transcript, onNoteAdded }) {
  const [keyPhrase, setKeyPhrase] = useState('');
  const [style, setStyle] = useState('detailed');
  const [loading, setLoading] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState([]);

  const expandPhrase = async () => {
    if (!keyPhrase.trim() || !transcript) return;
    
    setLoading(true);
    try {
      const response = await api.post('/ai/expand-micronote', {
        key_phrase: keyPhrase,
        transcript_context: transcript,
        style_preference: style
      });
      
      const newNote = response.data;
      setExpandedNotes(prev => [newNote, ...prev]);
      setKeyPhrase('');
      
      if (onNoteAdded) onNoteAdded(newNote);
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to expand micronote');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      expandPhrase();
    }
  };

  return (
    <div className="bg-[#181b21]/95 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/10">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-[#f4f1ed]">
        <Zap className="text-[#f0b39e]" size={28} />
        Micronotes Expansion
      </h2>

      {!transcript && (
        <div className="bg-[#d97757]/10 p-4 rounded-lg mb-4 border border-[#d97757]/30">
          <p className="text-sm text-[#ece3dc]/85">First transcribe audio or upload a lecture transcript to enable micronotes.</p>
        </div>
      )}

      {/* Input Section */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2 text-[#ece3dc]/85">Quick Key Phrase</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={keyPhrase}
            onChange={(e) => setKeyPhrase(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., photosynthesis process, Newton's second law..."
            className="flex-1 p-3 border border-white/15 rounded-lg focus:ring-2 focus:ring-[#d97757]/35 focus:border-transparent transition text-[#f4f1ed] bg-white/5"
            disabled={!transcript}
          />
          <button 
            onClick={expandPhrase} 
            disabled={loading || !transcript || !keyPhrase.trim()}
            className="px-6 py-3 bg-[#d97757] text-white rounded-lg font-semibold hover:bg-[#bf6548] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
            {loading ? 'Expanding...' : 'Expand'}
          </button>
        </div>

        {/* Style Selector */}
        <div className="mt-4 flex items-center gap-3">
          <span className="text-sm font-semibold text-[#ece3dc]/85">Expansion Style:</span>
          <div className="flex gap-2">
            {[
              { value: 'detailed', label: 'Detailed' },
              { value: 'concise', label: 'Concise' },
              { value: 'bullet_points', label: 'Bullets' }
            ].map(s => (
              <button
                key={s.value}
                onClick={() => setStyle(s.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm ${
                  style === s.value 
                    ? 'bg-[#d97757] text-white shadow-md' 
                    : 'bg-white/5 text-[#ece3dc]/80 hover:bg-white/10'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Expanded Notes */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
        <AnimatePresence>
          {expandedNotes.map((note, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
              className="border-l-4 border-[#7ea389] bg-[#7ea389]/10 p-5 rounded-lg shadow-md hover:shadow-lg transition"
            >
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-[#f4f1ed]">
                <span className="text-[#b9d0be]">{note.original_phrase}</span>
              </h3>
              <div className="prose prose-sm max-w-none text-[#ece3dc]/85 whitespace-pre-wrap">
                {note.expanded_content}
              </div>
              
              {note.relevant_quotes && note.relevant_quotes.length > 0 && (
                <div className="mt-4 p-3 bg-white/5 rounded-lg border border-[#7ea389]/30">
                  <p className="font-semibold text-sm text-[#ece3dc]/85 mb-2">Relevant Quotes from Lecture:</p>
                  {note.relevant_quotes.map((quote, i) => (
                    <p key={i} className="italic text-sm ml-4 mb-1 text-[#ece3dc]/75 border-l-2 border-white/20 pl-3">
                      "{quote}"
                    </p>
                  ))}
                </div>
              )}

              {note.timestamp_references && note.timestamp_references.length > 0 && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {note.timestamp_references.map((ref, i) => (
                    <span key={i} className="px-3 py-1 bg-[#b89b67]/20 text-[#dfc8a1] rounded-full text-xs font-medium flex items-center gap-1 shadow-sm">
                      <Clock size={12} />
                      {ref.time} - {ref.relevance}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {expandedNotes.length === 0 && transcript && (
          <div className="text-center py-8 text-[#ece3dc]/65">
            <Zap size={48} className="mx-auto mb-3 text-[#ece3dc]/30" />
            <p>Type a key phrase above and press Enter to expand it using your lecture transcript</p>
          </div>
        )}
      </div>
    </div>
  );
}
