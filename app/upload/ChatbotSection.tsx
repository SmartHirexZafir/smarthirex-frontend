'use client';

import { useState, useRef, useEffect } from 'react';

const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:10000').replace(/\/$/, '');

export default function ChatbotSection({
  onPromptSubmit,
  isProcessing,
  activePrompt,
}: {
  onPromptSubmit: (prompt: string, candidates: any[]) => void;
  isProcessing: boolean;
  activePrompt: string;
}) {
  const [messages, setMessages] = useState<
    { id: number; type: 'bot' | 'user'; content: string; timestamp: string }[]
  >([
    {
      id: 1,
      type: 'bot',
      content:
        "Hi! I'm your AI recruiting assistant. Try asking me something like 'Show me candidates with React and Django experience'",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    'Show me candidates with React + Django experience',
    'Find frontend developers with 3+ years experience',
    'Show Python developers in San Francisco',
    'Find candidates with Machine Learning skills',
    'Show full-stack developers with AWS experience',
    'Find UI/UX designers with Figma skills',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (prompt = inputValue.trim()) => {
    if (!prompt) return;

    const timestamp = new Date().toLocaleTimeString();
    const userMessage = {
      id: Date.now(),
      type: 'user' as const,
      content: prompt,
      timestamp,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      const response = await fetch(`${API_BASE}/chatbot/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        // if you also store token as cookie, uncomment:
        // credentials: 'include',
        body: JSON.stringify({ prompt }),
      });

      if (response.status === 401) {
        // not logged in / token missing
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            type: 'bot',
            content: 'You are not logged in or your session expired. Please log in again.',
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        onPromptSubmit(prompt, []);
        return;
      }

      const data = await response.json().catch(() => ({} as any));

      const botMessage = {
        id: Date.now() + 2,
        type: 'bot' as const,
        content: data.reply || 'Got it! Let me find some candidates for you.',
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, botMessage]);
      onPromptSubmit(prompt, Array.isArray(data.resumes_preview) ? data.resumes_preview : []);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 3,
          type: 'bot',
          content: "Sorry, I couldn't process your request. Please try again later.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      onPromptSubmit(prompt, []);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>

      <div className="relative z-10">
        {/* Header */}
        <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
          <div className="flex items-center justify-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
              <i className="ri-robot-line text-2xl text-white"></i>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900">AI Assistant</h3>
              <p className="text-gray-600">Ask me to find specific candidates for your needs</p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Messages */}
        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl transition-all duration-300 ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'bg-gray-100/80 text-gray-900 border border-gray-200/50 shadow-sm'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p
                  className={`text-xs mt-2 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {message.timestamp}
                </p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100/80 px-4 py-3 rounded-2xl border border-gray-200/50 shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        <div className="px-6 pb-4">
          <p className="text-sm text-gray-600 mb-3 text-center">💡 Try these suggestions:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestedPrompts.slice(0, 4).map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleSubmit(prompt)}
                className="bg-gradient-to-r from-blue-50 to-purple-50 text-gray-700 px-4 py-2 rounded-full text-sm hover:from-blue-100 hover:to-purple-100 transition-all duration-200 border border-gray-200/50 hover:border-blue-300 transform hover:scale-105"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-6 border-t border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-blue-50/50">
          <div className="flex space-x-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Ask me to find candidates..."
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white/80 backdrop-blur-sm text-gray-900 placeholder-gray-500"
              disabled={isProcessing}
            />
            <button
              onClick={() => handleSubmit()}
              disabled={isProcessing || !inputValue.trim()}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 min-w-[60px] flex items-center justify-center"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <i className="ri-send-plane-2-line text-lg"></i>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
