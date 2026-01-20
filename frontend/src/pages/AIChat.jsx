import { useState } from 'react';
import api from '../services/api';
import { Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';

export default function AIChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

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
        content: response.data.response || response.data.message
      }]);
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to get AI response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8\">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm\">
        <div className="p-4 border-b border-gray-200\">
          <div className="flex items-center gap-2\">
            <Bot className="w-6 h-6 text-blue-600\" />
            <h1 className="text-xl font-semibold text-gray-900\">AI Chat</h1>
          </div>
        </div>
        
        <div className="p-4 h-[500px] overflow-y-auto\">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400\">
              <Bot className="w-16 h-16 mb-4\" />
              <p className="text-lg\">Start a conversation</p>
            </div>
          ) : (
            <div className="space-y-4\">
              {messages.map((message, index) => (
                <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0\">
                      <Bot className="w-5 h-5 text-blue-600\" />
                    </div>
                  )}
                  <div className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap\">{message.content}</p>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0\">
                      <UserIcon className="w-5 h-5 text-gray-600\" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3\">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center\">
                    <Bot className="w-5 h-5 text-blue-600\" />
                  </div>
                  <div className="bg-gray-100 rounded-lg px-4 py-2\">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-600\" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200\">
          <form onSubmit={sendMessage} className="flex gap-2\">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500\"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed\"
            >
              <Send className="w-4 h-4\" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
