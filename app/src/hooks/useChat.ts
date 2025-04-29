import { useState } from 'react';
import { ChatMessage, EnergyMetrics } from '../types';
import { simulateAIResponse } from '../utils/mockAI';
import {
  saveChatMessage,
  getChatMessages,
  updateUserStats,
  clearChatMessages
} from '../utils/localStorage';
import { v4 as uuidv4 } from 'uuid';

interface SendMessageOptions {
  overrideResponse?: string;
  efficiency?: 'high' | 'medium' | 'low';
  usage?: number;
}

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(getChatMessages());
  const [isLoading, setIsLoading] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState<EnergyMetrics | null>(null);

  // Send a new message
  const sendMessage = async (content: string, options?: SendMessageOptions) => {
    if (!content.trim()) return;

    // Create user message
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    // Add user message to state and localStorage
    setMessages(prev => [...prev, userMessage]);
    saveChatMessage(userMessage);

    // Set loading state
    setIsLoading(true);
    setCurrentMetrics(null);

    try {
      let response: string;
      let metrics: EnergyMetrics;

      // Check if we have an override response
      if (options?.overrideResponse) {
        response = options.overrideResponse;
        metrics = {
          usage: options.usage || 90,
          efficiency: options.efficiency || 'low',
          suggestions: ["Be more concise and specific in your prompts"]
        };
      } else {
        // Simulate AI response
        const result = await simulateAIResponse(content);
        response = result.response;
        metrics = result.metrics;
      }

      // Create AI response message
      const aiMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
        energyUsage: metrics.usage,
        efficiency: metrics.efficiency
      };

      // Add AI message to state and localStorage
      setMessages(prev => [...prev, aiMessage]);
      saveChatMessage(aiMessage);

      // Set current metrics
      setCurrentMetrics(metrics);

      // Update user stats
      updateUserStats(metrics.usage, metrics.efficiency);

      return {
        success: true,
        metrics
      };
    } catch (error) {
      console.error('Error getting AI response:', error);
      return {
        success: false,
        error: 'Failed to get response'
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Reset/clear all chat messages
  const resetChat = () => {
    // Clear messages from localStorage
    clearChatMessages();

    // Clear messages from state
    setMessages([]);

    // Clear current metrics
    setCurrentMetrics(null);
  };

  return {
    messages,
    isLoading,
    currentMetrics,
    sendMessage,
    resetChat
  };
};