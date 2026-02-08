import { useState } from 'react';
import api from '../services/api';
import { Edit3, Save, Sparkles, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export default function AIDraftNotes() {
  const [inputText, setInputText] = useState('');
  const [draftNotes, setDraftNotes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editedSections, setEditedSections] = useState([]);
  const [savedMessage, setSavedMessage] = useState('');
  const { user } = useAuth();

  const generateDraft = async () => {
    if (!inputText.trim()) {
      alert('Please enter some text to generate draft notes');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/ai/generate-draft-notes', { text: inputText });
      setDraftNotes(response.data);
      setEditedSections(response.data.sections.map(s => ({ ...s })));
      setSavedMessage('');
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to generate draft');
    } finally {
      setLoading(false);
    }
  };

  const updateSection = (index, newContent) => {
    const updated = [...editedSections];
    updated[index].content = newContent;
    setEditedSections(updated);
  };

  const saveNotes = async () => {
    try {
      const content = editedSections.map(s => `## ${s.title}\n\n${s.content}`).join('\n\n');
      const fullContent = `# ${draftNotes.draft_title}\n\n${content}`;
      
      // Save to texts collection (same as other text documents)
      await api.post('/texts/', {
        title: draftNotes.draft_title,
        content: fullContent
      });
      
      setSavedMessage('Notes saved to Texts successfully! 🎉');
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to save notes');
    }
  };

  const exportAsMarkdown = () => {
    const content = editedSections.map(s => `## ${s.title}\n\n${s.content}`).join('\n\n');
    const fullContent = `# ${draftNotes.draft_title}\n\n${content}`;
    
    const blob = new Blob([fullContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${draftNotes.draft_title.replace(/[^a-z0-9]/gi, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          AI Draft Notes - Active Learning
        </h1>
        <p className="text-gray-600">Generate incomplete draft notes that you must actively complete and expand</p>
      </div>
      
      {/* Input Section */}
      {!draftNotes && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-white rounded-xl shadow-lg p-6 border border-gray-200"
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-800">
            <FileText className="text-blue-500" />
            Enter Your Study Material
          </h2>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your lecture transcript, study material, or any text you want to create notes from..."
            className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm text-gray-900 bg-white"
          />
          <button 
            onClick={generateDraft} 
            disabled={loading || !inputText.trim()}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <Sparkles size={20} />
            {loading ? 'Generating Draft...' : 'Generate Draft Notes'}
          </button>
        </motion.div>
      )}

      {/* Draft Notes Editor */}
      <AnimatePresence>
        {draftNotes && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Completeness Info */}
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-xl border-l-4 border-yellow-400 shadow-md">
              <div className="flex items-start gap-4">
                <AlertCircle className="text-yellow-600 flex-shrink-0" size={24} />
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 text-gray-800">
                    📊 Completeness: {draftNotes.completeness_score}%
                  </h3>
                  <p className="text-sm text-gray-700 mb-3">
                    This is an <strong>incomplete draft</strong>. Your task is to fill in the gaps, expand sections, and add your own understanding!
                  </p>
                  <div className="bg-white/50 p-3 rounded-lg">
                    <p className="font-semibold text-sm mb-2 text-gray-800">✅ Suggested Improvements:</p>
                    <ul className="text-sm space-y-1">
                      {draftNotes.suggested_improvements.map((imp, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-700">
                          <span className="text-yellow-600">•</span>
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Title Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">{draftNotes.draft_title}</h2>
              <p className="text-sm text-gray-500">Edit each section below to complete your notes</p>
            </div>

            {/* Editable Sections */}
            {editedSections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition"
              >
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                  <Edit3 size={20} className="text-blue-500" />
                  {section.title}
                </h3>
                <textarea
                  value={section.content}
                  onChange={(e) => updateSection(index, e.target.value)}
                  className="w-full h-56 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 bg-white"
                  placeholder="Add your understanding here..."
                />
                <div className="mt-2 text-xs text-gray-500">
                  {section.content.length} characters • Look for [PLACEHOLDERS] to fill in
                </div>
              </motion.div>
            ))}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center pb-8">
              <button 
                onClick={saveNotes} 
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <Save size={20} />
                Save Completed Notes
              </button>
              <button 
                onClick={exportAsMarkdown}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-indigo-700 transition shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <FileText size={20} />
                Export as Markdown
              </button>
              <button 
                onClick={() => { setDraftNotes(null); setInputText(''); }}
                className="px-8 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition shadow-md hover:shadow-lg"
              >
                Start New Draft
              </button>
            </div>

            {/* Success Message */}
            <AnimatePresence>
              {savedMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  className="fixed bottom-8 right-8 bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3"
                >
                  <CheckCircle size={24} />
                  <span className="font-semibold">{savedMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
