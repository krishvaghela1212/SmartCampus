import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from '@apollo/client/react';
import { CHAT_MUTATION } from '@/graphql/mutations';
import { MessageCircle, X, Send, Bot, Sparkles, RefreshCw } from 'lucide-react';
import { ChatMessage, Faculty } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatbotProps {
  facultyData: Faculty[];
  embedded?: boolean;
}

const QUICK_PROMPTS = [
  "Who is available now?",
  "Dr. Chirag Thaker status?",
  "How to book appointment?",
  "GTU exam results link?"
];

export const Chatbot: React.FC<ChatbotProps> = ({ facultyData, embedded = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'model',
      text: "👋 Hi! I'm the EasyConnect AI. I can help you with faculty availability, booking appointments, and campus information. What would you like to know?",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);

  const [chatMutation, { loading: isLoading }] = useMutation<{ chat: { text: string } }>(CHAT_MUTATION);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    setShowQuickPrompts(false);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: Date.now()
    };

    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    setMessages(prev => [...prev, userMsg]);
    setInput('');

    try {
      const { data } = await chatMutation({
        variables: {
          message: textToSend,
          history: history
        }
      });

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: data?.chat?.text || "I couldn't process that request.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error: any) {
      console.error('Chat error:', error);

      // Extract meaningful error message
      let errorMessage = "Sorry, I'm having trouble connecting right now. Please try again.";
      if (error?.graphQLErrors?.length > 0) {
        errorMessage = error.graphQLErrors[0].message;
      } else if (error?.networkError) {
        errorMessage = "Cannot connect to server. Please check if the backend is running.";
      } else if (error?.message) {
        errorMessage = error.message;
      }

      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: errorMessage,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: '0',
        role: 'model',
        text: "👋 Hi! I'm the EasyConnect AI. I can help you with faculty availability, booking appointments, and campus information. What would you like to know?",
        timestamp: Date.now()
      }
    ]);
    setShowQuickPrompts(true);
  };

  const MessageBubble = ({ msg }: { msg: ChatMessage }) => (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      {msg.role === 'model' && (
        <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center mr-2 flex-shrink-0 border border-accent/20">
          <Bot className="w-4 h-4 text-accent" />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === 'user'
          ? 'bg-accent text-bgPrimary rounded-br-sm'
          : 'bg-bgSecondary border border-border text-textPrimary rounded-bl-sm'
          }`}
      >
        <p className="whitespace-pre-wrap">{msg.text}</p>
      </div>
    </motion.div>
  );

  const ThinkingIndicator = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start"
    >
      <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center mr-2 flex-shrink-0 border border-accent/20">
        <Bot className="w-4 h-4 text-accent" />
      </div>
      <div className="bg-bgSecondary border border-border px-4 py-3 rounded-2xl rounded-bl-sm">
        <div className="flex items-center space-x-1.5">
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
            className="w-2 h-2 bg-accent rounded-full"
          />
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
            className="w-2 h-2 bg-accent rounded-full"
          />
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
            className="w-2 h-2 bg-accent rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );

  const QuickPrompts = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-2 mt-2"
    >
      {QUICK_PROMPTS.map((prompt, i) => (
        <button
          key={i}
          onClick={() => handleSend(prompt)}
          className="px-3 py-1.5 text-xs font-medium bg-bgSecondary border border-border rounded-full text-textSecondary hover:text-accent hover:border-accent transition-all"
        >
          {prompt}
        </button>
      ))}
    </motion.div>
  );

  // Embedded version (for AI Assistant page)
  if (embedded) {
    return (
      <div className="flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-bgSecondary to-card p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center border border-accent/20">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div>
              <span className="font-bold text-textPrimary block text-sm">EasyConnect AI</span>
              <span className="text-[10px] text-emerald-500 uppercase tracking-wider font-bold flex items-center">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1 animate-pulse" />
                Online
              </span>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="p-2 hover:bg-white/5 rounded-lg text-textSecondary hover:text-accent transition-colors"
            title="Reset conversation"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-bgPrimary/50">
          <AnimatePresence>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
          </AnimatePresence>
          {isLoading && <ThinkingIndicator />}
          {showQuickPrompts && messages.length === 1 && <QuickPrompts />}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-bgSecondary border-t border-border">
          <div className="flex items-center space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about faculty, exams, or campus..."
              className="flex-1 bg-bgPrimary border border-border rounded-full px-4 py-2.5 text-sm text-textPrimary focus:outline-none focus:border-accent transition-colors"
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="p-2.5 bg-accent text-bgPrimary rounded-full hover:bg-accentHover disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Floating chatbot widget
  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        initial={{ scale: 0 }}
        animate={{ scale: isOpen ? 0 : 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 p-3 md:p-4 bg-accent text-bgPrimary rounded-full shadow-2xl shadow-accent/30 z-40"
      >
        <MessageCircle className="w-6 h-6 md:w-7 md:h-7" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-4 md:inset-auto md:bottom-6 md:right-6 md:w-96 md:h-[520px] bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-border z-50"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-bgSecondary to-card p-4 flex justify-between items-center border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center border border-accent/20">
                  <Sparkles className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <span className="font-bold block text-sm text-textPrimary">EasyConnect AI</span>
                  <span className="text-[10px] text-emerald-500 uppercase tracking-wider font-bold flex items-center">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1 animate-pulse" />
                    Online
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleReset}
                  className="p-2 hover:bg-white/5 rounded-lg text-textSecondary hover:text-accent transition-colors"
                  title="Reset"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-lg text-textSecondary hover:text-error transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-bgPrimary/50">
              <AnimatePresence>
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} />
                ))}
              </AnimatePresence>
              {isLoading && <ThinkingIndicator />}
              {showQuickPrompts && messages.length === 1 && <QuickPrompts />}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-bgSecondary border-t border-border">
              <div className="flex items-center space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-bgPrimary border border-border rounded-full px-4 py-2.5 text-sm text-textPrimary focus:outline-none focus:border-accent transition-colors"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={isLoading || !input.trim()}
                  className="p-2.5 bg-accent text-bgPrimary rounded-full hover:bg-accentHover disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};