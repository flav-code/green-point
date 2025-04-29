import { useState } from 'react';
import { ChatMessage, EnergyMetrics } from '../types';
import { simulateAIResponse } from '../utils/mockAI';
import { saveChatMessage, getChatMessages, updateUserStats } from '../utils/localStorage';
import { v4 as uuidv4 } from 'uuid';

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(getChatMessages());
  const [isLoading, setIsLoading] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState<EnergyMetrics | null>(null);
  
  // Send a new message
  const sendMessage = async (content: string) => {
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
      // Simulate AI response
      const { response, metrics } = await simulateAIResponse(content);
      
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
  
  return {
    messages,
    isLoading,
    currentMetrics,
    sendMessage
  };
};