import { useCallback, useMemo, useState } from 'react';
import {
  ChatMessage,
  ChatMessages,
  ChatInput,
  ChatSection
} from '@llamaindex/chat-ui';

interface LlamaChatProps {
  onClose?: () => void;
}

const DEFAULT_MESSAGES = [
  {
    id: 'intro',
    role: 'assistant' as const,
    parts: [
      {
        type: 'text' as const,
        text: 'Welcome to the LlamaIndex Canvas Chat. Use this space to request study guides, molecule descriptions, or spectrum insights.'
      }
    ]
  }
];

const LlamaChatInner = () => {
  const [messages, setMessages] = useState(DEFAULT_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const newMessage = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      parts: [
        {
          type: 'text' as const,
          text: trimmed
        }
      ]
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue('');
    setIsLoading(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant' as const,
          parts: [
            {
              type: 'text' as const,
              text: `Here is where Gemini response would appear for: "${trimmed}"`
            }
          ]
        }
      ]);
      setIsLoading(false);
    }, 600);
  }, [inputValue]);

  const chatHandler = useMemo(() => ({
    messages,
    status: isLoading ? 'streaming' as const : 'ready' as const,
    sendMessage: async () => {
      await handleSend();
    }
  }), [messages, isLoading, handleSend]);

  return (
    <ChatSection handler={chatHandler} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <ChatMessages className="px-4 py-6 space-y-4">
          {messages.map((msg, index) => (
            <ChatMessage key={msg.id} message={msg} isLast={index === messages.length - 1} />
          ))}
        </ChatMessages>
      </div>
      <div className="border-t border-slate-800 p-4">
        <ChatInput
          value={inputValue}
          placeholder="Ask the LlamaIndex assistant..."
          onChange={setInputValue}
          onSubmit={handleSend}
          disabled={isLoading}
        />
      </div>
    </ChatSection>
  );
};

const LlamaChat: React.FC<LlamaChatProps> = ({ onClose }) => {
  return (
    <div className="h-full bg-slate-900 text-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <h3 className="text-sm font-semibold">LlamaIndex Canvas Chat</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-md"
          >
            Close
          </button>
        )}
      </div>
      <ChatProvider
        value={{
          messages: DEFAULT_MESSAGES,
          status: 'ready',
          sendMessage: async () => {},
          setMessages: () => {},
          input: '',
          setInput: () => {},
          requestData: null,
          setRequestData: () => {},
          isLoading: false
        }}
      >
        <LlamaChatInner />
      </ChatProvider>
    </div>
  );
};

export default LlamaChat;

