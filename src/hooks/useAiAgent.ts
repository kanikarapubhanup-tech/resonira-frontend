import { useState } from 'react';
import api from '../lib/api';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const useAiAgent = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content };
    
    // Optimistically add user message to UI
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/agent/chat', {
        message: content,
        // Send history excluding the current message
        conversation: messages.filter(m => m.role !== 'system'), 
      });

      if (response.data.success) {
        setMessages((prev) => [
          ...prev, 
          { role: 'assistant', content: response.data.data.message }
        ]);
      } else {
        throw new Error(response.data.message || 'Failed to get AI response');
      }
    } catch (err: any) {
      console.error('[useAiAgent] Chat error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'An unexpected error occurred';
      setError(errorMessage);
      
      // Add error message to chat so user sees it
      setMessages((prev) => [
        ...prev, 
        { role: 'assistant', content: `Sorry, I encountered an error: ${errorMessage}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat
  };
};
