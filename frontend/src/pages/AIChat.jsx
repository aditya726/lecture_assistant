import { useMemo, useState } from 'react';
import api from '../services/api';
import { Send, Bot, User as UserIcon, Loader2, FileUp, Mic } from 'lucide-react';
import AudioRecorder from '../components/AudioRecorder';
import FileUploader from '../components/FileUploader';
import MarkdownRenderer, { normalizeLLMText } from '../components/MarkdownRenderer';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);

  // using shared normalizeLLMText from MarkdownRenderer

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/ai/generate', { prompt: input });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: normalizeLLMText(response.data.response || response.data.message)
      }]);
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to get AI response');
    } finally {
      setLoading(false);
    }
  };

  const handleTranscription = (transcription, fullData) => {
    // Add transcription to input
    setInput(prev => prev + (prev ? ' ' : '') + transcription);
    
    // Show notification
    setMessages(prev => [...prev, {
      role: 'system',
      content: `🎤 Transcribed: "${transcription}"`
    }]);
    
    setShowAudioRecorder(false);
  };

  const handleFileProcessed = (data) => {
    // Add file processing result to messages
    let content = `📄 File processed: ${data.filename}\n\n`;
    
    if (data.ai_analysis) {
      if (data.ai_analysis.summary) {
        content += `**Summary:**\n${data.ai_analysis.summary}\n\n`;
      }
      if (data.ai_analysis.key_points) {
        content += `**Key Points:**\n${data.ai_analysis.key_points.map(p => `• ${p}`).join('\n')}\n\n`;
      }
      if (data.ai_analysis.main_topics) {
        content += `**Topics:**\n${data.ai_analysis.main_topics.map(t => `• ${t}`).join('\n')}\n\n`;
      }
      if (data.ai_analysis.keywords) {
        content += `**Keywords:** ${data.ai_analysis.keywords.join(', ')}\n`;
      }
    }
    
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: normalizeLLMText(content)
    }]);
    
    setShowFileUpload(false);
  };

  const handleError = (errorMessage) => {
    alert(errorMessage);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-400/40 to-indigo-500/40 flex items-center justify-center border border-white/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-white/90">AI Chat</h1>
          </div>
        </div>
        
        <div className="p-8 h-[600px] overflow-y-auto space-y-5">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/60">
              <div className="h-16 w-16 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center mb-4 backdrop-blur">
                <Bot className="w-8 h-8" />
              </div>
              <p className="text-lg">Start a conversation</p>
              <p className="text-sm mt-2">Type, record audio, or upload files</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 
                  message.role === 'system' ? 'justify-center' : 'justify-start'
                }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400/40 to-indigo-500/40 border border-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[72%] rounded-2xl px-5 py-4 text-base leading-relaxed shadow-md border ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-cyan-500/30 to-blue-600/30 text-white border-white/20'
                      : message.role === 'system'
                      ? 'bg-amber-100/80 text-amber-900 border-amber-200'
                      : 'bg-white/10 text-white/90 border-white/10 backdrop-blur'
                  }`}>
                    {message.role === 'assistant' || message.role === 'system' ? (
                      <MarkdownRenderer content={message.content} />
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 text-white backdrop-blur">
                      <UserIcon className="w-5 h-5" />
                    </div>
                  )}
                </motion.div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white backdrop-blur">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="rounded-2xl px-5 py-3 bg-white/10 text-white/80 border border-white/10 backdrop-blur flex items-center gap-1">
                    <motion.span
                      className="block h-1.5 w-1.5 rounded-full bg-white/80"
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.span
                      className="block h-1.5 w-1.5 rounded-full bg-white/80"
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
                    />
                    <motion.span
                      className="block h-1.5 w-1.5 rounded-full bg-white/80"
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                    />
                  </div>
                </div>
              )}
            </AnimatePresence>
          )}
        </div>
        
        <div className="p-8 border-t border-white/10">
          {/* File Upload Section */}
          {showFileUpload && (
            <div className="mb-4">
              <FileUploader 
                onFileProcessed={handleFileProcessed}
                onError={handleError}
              />
            </div>
          )}

          {/* Audio Recorder Section */}
          {showAudioRecorder && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <AudioRecorder 
                onTranscriptionComplete={handleTranscription}
                onError={handleError}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => {
                setShowAudioRecorder(!showAudioRecorder);
                setShowFileUpload(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition-colors border ${
                showAudioRecorder 
                  ? 'bg-rose-500/20 text-rose-100 border-rose-200/30' 
                  : 'bg-white/10 text-white/90 hover:bg-white/20 border-white/10 backdrop-blur'
              }`}
            >
              <Mic className="w-4 h-4" />
              {showAudioRecorder ? 'Hide Recorder' : 'Voice Input'}
            </button>
            <button
              onClick={() => {
                setShowFileUpload(!showFileUpload);
                setShowAudioRecorder(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition-colors border ${
                showFileUpload 
                  ? 'bg-indigo-500/20 text-indigo-100 border-indigo-200/30' 
                  : 'bg-white/10 text-white/90 hover:bg-white/20 border-white/10 backdrop-blur'
              }`}
            >
              <FileUp className="w-4 h-4" />
              {showFileUpload ? 'Hide Upload' : 'Upload File'}
            </button>
          </div>

          {/* Text Input Form */}
          <form onSubmit={sendMessage} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
              className="flex-1 px-5 py-3.5 rounded-xl border border-white/10 bg-white/10 text-white/90 placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 backdrop-blur"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-3.5 rounded-xl bg-gradient-to-br from-cyan-500/80 to-indigo-600/80 text-white hover:from-cyan-500 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
