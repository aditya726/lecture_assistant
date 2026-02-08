import { useMemo, useState } from 'react';
import api from '../services/api';
import { Send, Bot, User as UserIcon, Loader2, FileUp, Mic } from 'lucide-react';
import AudioRecorder from '../components/AudioRecorder';
import FileUploader from '../components/FileUploader';
import MarkdownRenderer, { normalizeLLMText } from '../components/MarkdownRenderer';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/toast';

export default function AIChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

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
      // Check for error in AI analysis
      if (data.ai_analysis.error) {
        content += `⚠️ **Analysis Error:** ${data.ai_analysis.error}\n\n`;
        if (data.ai_analysis.raw_response) {
          content += `**Raw Response:**\n${data.ai_analysis.raw_response}\n\n`;
        }
      } else {
        let hasContent = false;
        
        // Handle Summarization format
        if (data.ai_analysis.summary) {
          content += `**Summary:**\n${data.ai_analysis.summary}\n\n`;
          hasContent = true;
        }
        if (data.ai_analysis.key_points && data.ai_analysis.key_points.length > 0) {
          content += `**Key Points:**\n${data.ai_analysis.key_points.map(p => `• ${p}`).join('\n')}\n\n`;
          hasContent = true;
        }
        
        // Handle Topic Extraction format
        if (data.ai_analysis.main_topics && data.ai_analysis.main_topics.length > 0) {
          content += `**Main Topics:**\n${data.ai_analysis.main_topics.map(t => `• ${t}`).join('\n')}\n\n`;
          hasContent = true;
        }
        if (data.ai_analysis.subtopics && data.ai_analysis.subtopics.length > 0) {
          content += `**Subtopics:**\n${data.ai_analysis.subtopics.map(t => `• ${t}`).join('\n')}\n\n`;
          hasContent = true;
        }
        
        // Handle Keyword Extraction format
        if (data.ai_analysis.keywords && data.ai_analysis.keywords.length > 0) {
          content += `**Keywords:** ${data.ai_analysis.keywords.join(', ')}\n\n`;
          hasContent = true;
        }
        if (data.ai_analysis.phrases && data.ai_analysis.phrases.length > 0) {
          content += `**Key Phrases:**\n${data.ai_analysis.phrases.map(p => `• ${p}`).join('\n')}\n\n`;
          hasContent = true;
        }
        
        // Handle Difficulty Classification format
        if (data.ai_analysis.difficulty_level) {
          content += `**Difficulty Level:** ${data.ai_analysis.difficulty_level}\n\n`;
          hasContent = true;
        }
        if (data.ai_analysis.reasoning) {
          content += `**Reasoning:**\n${data.ai_analysis.reasoning}\n\n`;
          hasContent = true;
        }
        if (data.ai_analysis.prerequisites && data.ai_analysis.prerequisites.length > 0) {
          content += `**Prerequisites:**\n${data.ai_analysis.prerequisites.map(p => `• ${p}`).join('\n')}\n\n`;
          hasContent = true;
        }
        
        // If no expected fields found, show the raw analysis object for debugging
        if (!hasContent) {
          content += `**Debug - Raw Analysis:**\n\`\`\`json\n${JSON.stringify(data.ai_analysis, null, 2)}\n\`\`\`\n\n`;
        }
      }
    } else {
      content += `*No AI analysis available for this file.*\n`;
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
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="grid md:grid-cols-12 gap-6">
        {/* Tutor Tips Sidebar */}
        <aside className="md:col-span-4 sketchy-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center border border-input">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{fontFamily:'Gloria Hallelujah'}}>Tutor Desk</h2>
              <p className="text-xs text-muted-foreground">Try these prompts</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              'Explain this concept simply',
              'Give a step-by-step solution',
              'Create practice questions',
              'Summarize this topic',
              'Suggest a study plan',
              'Quiz me on this'
            ].map((s, i) => (
              <button key={i} onClick={() => setInput(s)} className="sketchy-button w-full text-left px-3 py-2 rounded-xl border bg-card hover:bg-card/80">
                {s}
              </button>
            ))}
          </div>
        </aside>

        {/* Chat Area */}
        <div className="md:col-span-8 sketchy-card rounded-2xl border bg-card backdrop-blur-xl shadow-2xl">
          <div className="p-6 border-b border-input">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center border border-input">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold" style={{fontFamily:'Gloria Hallelujah'}}>Tutor Chat</h1>
                <p className="text-xs text-muted-foreground">Friendly study guide—ask, explore, and learn</p>
              </div>
            </div>
          </div>
        
        <div className="p-8 h-[600px] overflow-y-auto space-y-5">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <div className="h-16 w-16 rounded-2xl bg-primary/20 border border-input flex items-center justify-center mb-4 backdrop-blur">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <p className="text-lg">Start a conversation</p>
              <p className="text-sm mt-2">
                {isAuthenticated ? 'Type, record audio, or upload files' : 'Type your question. Login to use voice or file upload.'}
              </p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-xl">
                {['Explain this concept simply','Give a step-by-step solution','Create practice questions','Summarize this topic','Suggest study plan'].map((s, i) => (
                  <button key={i} onClick={() => setInput(s)} className="sketchy-button px-3 py-2 rounded-xl border bg-card hover:bg-card/80 text-sm">
                    {s}
                  </button>
                ))}
              </div>
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
                    <div className={`scribble-bubble max-w-[72%] rounded-2xl px-5 py-4 text-base leading-relaxed shadow-md border ${
                    message.role === 'user'
                      ? 'bg-primary/20 text-foreground border-input'
                      : message.role === 'system'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-card text-foreground border-input backdrop-blur'
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
                  <div className="w-9 h-9 rounded-xl bg-muted/40 border border-input flex items-center justify-center text-foreground dark:bg-white/10 dark:border-white/20 dark:text-white backdrop-blur">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="rounded-2xl px-5 py-3 bg-muted/40 text-foreground border border-input backdrop-blur flex items-center gap-1 dark:bg-white/10 dark:text-white/80 dark:border-white/10">
                    <motion.span
                      className="block h-1.5 w-1.5 rounded-full bg-foreground dark:bg-white/80"
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.span
                      className="block h-1.5 w-1.5 rounded-full bg-foreground dark:bg-white/80"
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
                    />
                    <motion.span
                      className="block h-1.5 w-1.5 rounded-full bg-foreground dark:bg-white/80"
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                    />
                  </div>
                </div>
              )}
            </AnimatePresence>
          )}
        </div>
        
        <div className="p-8 border-t border-input">
          {/* File Upload Section */}
          {showFileUpload && isAuthenticated && (
            <div className="mb-4">
              <FileUploader 
                onFileProcessed={handleFileProcessed}
                onError={handleError}
              />
            </div>
          )}

          {/* Audio Recorder Section */}
          {showAudioRecorder && isAuthenticated && (
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
                if (!isAuthenticated) {
                  toast({ title: 'Login required', description: 'Please log in to use voice input', variant: 'destructive' });
                  return;
                }
                setShowAudioRecorder(!showAudioRecorder);
                setShowFileUpload(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition-colors border ${
                showAudioRecorder 
                  ? 'bg-rose-200 text-rose-900 border-rose-300' 
                  : 'bg-card text-foreground hover:bg-card/80 border-input backdrop-blur'
              }`}
            >
              <Mic className="w-4 h-4" />
              {showAudioRecorder ? 'Hide Recorder' : 'Voice Input'}
            </button>
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  toast({ title: 'Login required', description: 'Please log in to upload files', variant: 'destructive' });
                  return;
                }
                setShowFileUpload(!showFileUpload);
                setShowAudioRecorder(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition-colors border ${
                showFileUpload 
                  ? 'bg-violet-200 text-violet-900 border-violet-300' 
                  : 'bg-card text-foreground hover:bg-card/80 border-input backdrop-blur'
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
              className="sketchy-input flex-1 px-5 py-3.5 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 backdrop-blur"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="sketchy-button px-5 py-3.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed border border-input"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
        </div>
      </div>
    </div>
  );
}
