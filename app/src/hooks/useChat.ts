import { useState } from 'react';
import { ChatMessage, EnergyMetrics } from '../types';
import { simulateAIResponse } from '../utils/mockAI';
import {
  saveChatMessage,
  getChatMessages,
  updateUserStats,
  clearChatMessages,
  getUser
} from '../utils/localStorage';
import { v4 as uuidv4 } from 'uuid';
import {dispatchUpdateEvent} from "../components/chat/updateService.ts";

interface SendMessageOptions {
  overrideResponse?: string;
  efficiency?: 'high' | 'medium' | 'low';
  usage?: number;
}

interface EvaluationResponse {
  success: boolean;
  evaluation: {
    isEcoResponsible: boolean;
    score: number;
    explanation: string;
    response: string;
  };
  teamUpdate: {
    teamId: string;
    newScore: number;
    pointChange: number;
  };
}

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(getChatMessages());
  const [isLoading, setIsLoading] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState<EnergyMetrics | null>(null);

  // Helper to convert Ollama evaluation to EnergyMetrics
  const convertEvaluationToMetrics = (evaluation: EvaluationResponse['evaluation']): EnergyMetrics => {
    // Determine efficiency based on score
    let efficiency: 'high' | 'medium' | 'low';
    if (evaluation.score >= 70) {
      efficiency = 'high';
    } else if (evaluation.score >= 40) {
      efficiency = 'medium';
    } else {
      efficiency = 'low';
    }

    // Map score (0-100) to usage (0-100), but in reverse (higher score = lower energy usage)
    const usage = Math.max(0, Math.min(100, 100 - evaluation.score));

    return {
      efficiency,
      usage,
      suggestions: evaluation.isEcoResponsible ? [] : [
        evaluation.explanation,
        "Be more specific and concise in your prompts",
        "Avoid unnecessary politeness formulas"
      ]
    };
  };

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
      let isEcoResponsible = false;

      // Check if we have an override response
      if (options?.overrideResponse) {
        response = options.overrideResponse;
        metrics = {
          usage: options.usage || 90,
          efficiency: options.efficiency || 'low',
          suggestions: ["Be more concise and specific in your prompts"]
        };
      } else {
        // Try to get evaluation from the server
        try {
          const user = getUser();
          if (!user) throw new Error('User not found');

          console.log("Sending prompt for evaluation:", content);
          const evaluationResponse = await fetch('http://127.0.0.1:4000/prompt/evaluate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              prompt: content,
              userId: user.id,
              teamId: user.teamId
            })
          });

          if (!evaluationResponse.ok) {
            throw new Error(`Failed to get evaluation from API: ${evaluationResponse.statusText}`);
          }

          const evaluationData: EvaluationResponse = await evaluationResponse.json();
          console.log("Received evaluation:", evaluationData);

          if (evaluationData.success) {
            // Use the evaluation from the API
            response = evaluationData.evaluation.response;
            metrics = convertEvaluationToMetrics(evaluationData.evaluation);
            isEcoResponsible = evaluationData.evaluation.isEcoResponsible;

            // Dispatch an event to update the team leaderboard
            dispatchUpdateEvent('team-score-updated', {
              teamId: user.teamId,
              newScore: evaluationData.teamUpdate.newScore,
              pointChange: evaluationData.teamUpdate.pointChange
            });
          } else {
            throw new Error('API evaluation unsuccessful: ' + JSON.stringify(evaluationData));
          }
        } catch (error) {
          console.error('Error using API evaluation, falling back to mock AI:', error);
          // Fall back to mock AI if API fails
          const result = await simulateAIResponse(content);
          response = result.response;
          metrics = result.metrics;
          isEcoResponsible = metrics.efficiency === 'high';
        }
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

      // Update user stats and explicitly notify about the update
      const updatedStats = updateUserStats(metrics.usage, metrics.efficiency);

      // Dispatch event for updated user stats
      dispatchUpdateEvent('user-stats-updated', {
        userId: getUser()?.id,
        stats: updatedStats
      });

      // General update notification
      dispatchUpdateEvent('user-data-updated', { timestamp: Date.now() });

      return {
        success: true,
        metrics,
        isEcoResponsible
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

    // Notify about user data reset
    dispatchUpdateEvent('user-data-updated', { timestamp: Date.now() });
  };

  return {
    messages,
    isLoading,
    currentMetrics,
    sendMessage,
    resetChat
  };
};