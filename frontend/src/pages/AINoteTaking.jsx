import { useState } from 'react';
import AudioRecorder from '../components/AudioRecorder';
import MicronotesPanel from '../components/MicronotesPanel';
import { FileText, Download, Upload, Mic, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AINoteTaking() {
  const [transcript, setTranscript] = useState('');
  const [allNotes, setAllNotes] = useState([]);
  const [transcriptSource, setTranscriptSource] = useState('');

  const handleTranscription = (transcriptionText, fullData) => {
    setTranscript(transcriptionText);
    setTranscriptSource('audio');
  };

  const handleTranscriptionError = (error) => {
    alert('Transcription failed: ' + error);
  };

  const handleManualTranscript = (e) => {
    setTranscript(e.target.value);
    setTranscriptSource('manual');
  };

  const handleNoteAdded = (note) => {
    setAllNotes(prev => [...prev, note]);
  };

  const exportNotes = () => {
    if (allNotes.length === 0) {
      alert('No notes to export yet!');
      return;
    }

    const content = `# My Lecture Notes\n\n${transcript ? `## Original Transcript\n\n${transcript}\n\n` : ''}## Expanded Notes\n\n` + 
      allNotes.map(n => 
        `### ${n.original_phrase}\n\n${n.expanded_content}\n\n${
          n.relevant_quotes && n.relevant_quotes.length > 0 
            ? `**Relevant Quotes:**\n${n.relevant_quotes.map(q => `> ${q}`).join('\n')}\n\n`
            : ''
        }`
      ).join('\n---\n\n');
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lecture-notes-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    if (confirm('Clear all notes and transcript? This cannot be undone.')) {
      setTranscript('');
      setAllNotes([]);
      setTranscriptSource('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
          <BookOpen size={40} className="text-purple-600" />
          AI Note-Taking Studio
        </h1>
        <p className="text-gray-600 ml-14">Record lectures, create quick key phrases, and expand them with AI</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Transcription */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Audio Recording Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
              <Mic className="text-red-500" />
              1. Record or Upload Audio
            </h2>
            <AudioRecorder 
              onTranscriptionComplete={handleTranscription}
              onError={handleTranscriptionError}
            />
          </div>
          
          {/* Manual Transcript Input */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
              <Upload className="text-blue-500" />
              Or Paste Transcript
            </h2>
            <textarea
              value={transcript}
              onChange={handleManualTranscript}
              placeholder="Paste your lecture transcript here, or record audio above..."
              className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm text-gray-900 bg-white"
            />
            {transcriptSource && (
              <div className="mt-2 text-xs text-gray-500">
                Source: {transcriptSource === 'audio' ? '🎤 Audio Recording' : '📝 Manual Input'}
              </div>
            )}
          </div>
          
          {/* Transcript Preview */}
          {transcript && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-300 shadow-inner"
            >
              <h3 className="font-bold mb-3 text-gray-800 flex items-center gap-2">
                <FileText size={18} />
                Transcript Preview ({transcript.length} characters)
              </h3>
              <div className="max-h-60 overflow-y-auto text-sm text-gray-700 bg-white p-4 rounded-lg border border-gray-200">
                {transcript}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Right Column: Micronotes */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="sticky top-6">
            <MicronotesPanel 
              transcript={transcript}
              onNoteAdded={handleNoteAdded}
            />
          </div>
        </motion.div>
      </div>

      {/* Action Bar */}
      {(allNotes.length > 0 || transcript) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 shadow-lg border border-purple-200"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-700">
                <span className="font-bold text-lg">{allNotes.length}</span> note{allNotes.length !== 1 ? 's' : ''} created
              </div>
              {transcript && (
                <div className="text-sm text-gray-700">
                  <span className="font-bold text-lg">{transcript.length}</span> chars in transcript
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={exportNotes} 
                disabled={allNotes.length === 0}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <Download size={20} />
                Export All Notes ({allNotes.length})
              </button>
              <button 
                onClick={clearAll}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-rose-700 transition shadow-md hover:shadow-lg"
              >
                Clear All
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Instructions Panel */}
      {!transcript && allNotes.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200 shadow-lg"
        >
          <h3 className="text-xl font-bold mb-4 text-gray-800">🚀 How to Use This Tool</h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl mb-2">1️⃣</div>
              <h4 className="font-bold mb-2 text-gray-800">Record/Upload</h4>
              <p className="text-gray-600">Record your lecture or paste a transcript in the left panel</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl mb-2">2️⃣</div>
              <h4 className="font-bold mb-2 text-gray-800">Type Key Phrases</h4>
              <p className="text-gray-600">Type quick phrases during or after lecture (e.g., "mitochondria function")</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl mb-2">3️⃣</div>
              <h4 className="font-bold mb-2 text-gray-800">AI Expands</h4>
              <p className="text-gray-600">AI finds relevant content from transcript and expands your phrase into complete notes</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
