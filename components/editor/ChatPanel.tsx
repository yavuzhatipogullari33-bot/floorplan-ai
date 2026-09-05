'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, MessageSquare } from 'lucide-react';
import { FloorPlanLayout } from '@/lib/svg-generator';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatPanelProps {
  currentLayout: FloorPlanLayout | null;
  projectId?: string;
  onLayoutUpdate: (layout: FloorPlanLayout, svg: string) => void;
  disabled?: boolean;
}

export default function ChatPanel({ currentLayout, projectId, onLayoutUpdate, disabled }: ChatPanelProps) {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(messageText?: string) {
    const text = messageText ?? input.trim();
    if (!text || isLoading || !currentLayout) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          currentLayout,
          projectId,
          history: messages.slice(-10),
          language,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Chat failed');
      }

      const assistantMsg: Message = { role: 'assistant', content: data.reply };
      setMessages((prev) => [...prev, assistantMsg]);
      onLayoutUpdate(data.layout, data.svg);
    } catch (err) {
      const errorMsg: Message = {
        role: 'assistant',
        content: `Error: ${String(err)}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const isDisabled = disabled || !currentLayout;

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4 text-green-600" />
          {t.editor.chatTitle}
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">
          {isDisabled ? t.editor.chatSubtitleDisabled : t.editor.chatSubtitleReady}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {messages.length === 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-gray-400 text-center py-4">
              {isDisabled
                ? t.editor.chatGenerateFirst
                : t.editor.chatSuggestionsTitle}
            </p>
            {!isDisabled && (
              <div className="flex flex-col gap-1.5">
                {t.editor.suggestions.map((s, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(s)}
                    className="text-left text-xs px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-gray-600 hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                'flex',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-1.5 flex-shrink-0 mt-0.5">
                  <Sparkles className="w-3 h-3 text-green-600" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-green-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                )}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-1.5 flex-shrink-0 mt-0.5">
              <Sparkles className="w-3 h-3 text-green-600" />
            </div>
            <div className="bg-gray-100 px-3 py-2 rounded-xl rounded-bl-sm flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
              <span className="text-xs text-gray-400">{t.editor.updatingLayout}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isDisabled ? t.editor.chatInputPlaceholderDisabled : t.editor.chatInputPlaceholder}
            disabled={isDisabled || isLoading}
            rows={2}
            className="input resize-none text-xs flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading || isDisabled}
            className="btn-primary p-2.5 flex-shrink-0 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-gray-300 mt-1.5">{t.editor.pressEnterHint}</p>
      </div>
    </div>
  );
}
