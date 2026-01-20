import React, { useState, useEffect, useRef } from 'react';
import { ChatModelType, ChatMessage } from '../types';
import { generateChatResponse } from '../services/geminiService';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [modelType, setModelType] = useState<ChatModelType>(ChatModelType.PRO_DEFAULT);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (modelType === ChatModelType.FLASH_MAPS) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          (err) => console.error("Geo error", err)
        );
      }
    }
  }, [modelType]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const isThinking = modelType === ChatModelType.PRO_THINKING;
      const response = await generateChatResponse(modelType, userMsg.text, history, location, isThinking);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text || "I couldn't generate a text response.",
        groundingUrls: response.groundingUrls,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: "Sorry, I encountered an error. Please try again.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
      {/* Header / Config */}
      <div className="p-4 bg-slate-800 border-b border-slate-700 flex flex-wrap gap-4 items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Chat</h2>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 uppercase tracking-wider">Model:</span>
          <select 
            value={modelType} 
            onChange={(e) => setModelType(e.target.value as ChatModelType)}
            className="bg-slate-700 text-sm text-white rounded px-3 py-1.5 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={ChatModelType.PRO_DEFAULT}>OmniGen 3 Pro (Standard)</option>
            <option value={ChatModelType.PRO_THINKING}>OmniGen 3 Pro (Thinking)</option>
            <option value={ChatModelType.FLASH_SEARCH}>OmniGen 3 Flash (Search Grounding)</option>
            <option value={ChatModelType.FLASH_MAPS}>OmniGen 2.5 Flash (Maps Grounding)</option>
            <option value={ChatModelType.FLASH_LITE}>OmniGen 2.5 Flash Lite (Fast)</option>
          </select>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="text-center text-slate-500 mt-20">
            <p className="mb-2">Start a conversation.</p>
            <p className="text-sm">Try asking about current events, local places, or complex logic puzzles.</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-100 rounded-bl-none'}`}>
              <div className="whitespace-pre-wrap">{msg.text}</div>
              {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-xs font-semibold mb-1 opacity-70">Sources:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {msg.groundingUrls.map((url, idx) => (
                      <li key={idx}>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-200 hover:underline break-all block">
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 text-slate-400 rounded-2xl rounded-bl-none p-4 animate-pulse">
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-slate-800 border-t border-slate-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 bg-slate-900 text-white rounded-lg px-4 py-3 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;