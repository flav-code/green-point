import React, { useState, useRef, useEffect } from 'react';
import { Send, Zap, AlertTriangle, CheckCircle, BarChart3, RefreshCw } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { useUser } from '../../hooks/useUser';
import { useTeams } from '../../hooks/useTeams';
import ChatMessage from './ChatMessage';
import ChatFeedback from './ChatFeedback';
import PromptStatusIndicator from './PromptStatusIndicator';
import { PromptValidationStatus } from '../../types';
import {
  validatePrompt,
  hasPolitenessFormula,
  getShortPromptMessage,
  getPolitenessFormulaMessage
} from './chatValidation';
import { updateEcoStreak, updateUserStats, getUser } from '../../utils/localStorage';
import { dispatchUpdateEvent } from './updateService';
import './ChatContainer.css';

interface ChatContainerProps {
  className?: string;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ className = '' }) => {
  const { messages, isLoading, currentMetrics, sendMessage, resetChat } = useChat();
  const { user, checkAchievements, refreshUser } = useUser();
  const { refreshTeams, addTeamPoints } = useTeams();
  const [prompt, setPrompt] = useState('');
  const [promptStatus, setPromptStatus] = useState<PromptValidationStatus>({
    status: 'idle',
    message: ''
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add keyboard shortcut (Ctrl+R) to reset chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault(); // Prevent browser refresh
        handleResetChat();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Validate prompt as user types
  useEffect(() => {
    setPromptStatus(validatePrompt(prompt));
  }, [prompt]);

  const handleResetChat = () => {
    if (window.confirm("Are you sure you want to reset the chat? All messages will be deleted and eco-streak will be reset to 0.")) {
      // Reset the chat messages
      resetChat();

      // Reset the eco-streak
      updateEcoStreak(false);

      // Refresh user data and teams
      refreshUser();
      refreshTeams();

      // Force update notifications
      dispatchUpdateEvent('user-data-updated', { timestamp: Date.now() });

      // Focus on input after reset
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  // Centralized function to process all updates after a response
  const processResponseUpdates = (isEcoResponsible: boolean, metrics: any) => {
    console.log("Processing response updates - eco-responsible:", isEcoResponsible);

    // 1. First directly update user stats
    const updatedStats = updateUserStats(metrics.usage, metrics.efficiency === 'high' ? 'high' : 'low');
    console.log("Updated user stats:", updatedStats);

    // 2. Check achievements
    checkAchievements({
      promptSubmitted: true,
      efficientPrompt: isEcoResponsible,
      ecoResponsiblePrompt: isEcoResponsible,
      resetEcoStreak: !isEcoResponsible
    });

    // 3. Directly update team points if the API call failed
    const currentUser = getUser();
    if (currentUser) {
      const pointChange = isEcoResponsible ? 10 : -10;
      console.log(`Adding ${pointChange} points to team ${currentUser.teamId}`);
      addTeamPoints(currentUser.teamId, pointChange);
    }

    // 4. Force UI updates
    refreshUser();
    refreshTeams();

    // 5. Broadcast updates to all components
    dispatchUpdateEvent('user-data-updated', { timestamp: Date.now() });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const trimmedPrompt = prompt.trim();
    const wordCount = trimmedPrompt.split(/\s+/).length;

    // Check for short prompts
    if (wordCount < 6) {
      const response = getShortPromptMessage();

      // Add user prompt and AI response to the chat
      await sendMessage(trimmedPrompt, {
        overrideResponse: response,
        efficiency: 'low',
        usage: 95
      });

      setPrompt('');

      // Process all updates in one centralized place
      processResponseUpdates(false, { usage: 95, efficiency: 'low' });
      return;
    }

    // Check for politeness formulas
    if (hasPolitenessFormula(trimmedPrompt)) {
      const response = getPolitenessFormulaMessage();

      // Add user prompt and AI response to the chat
      await sendMessage(trimmedPrompt, {
        overrideResponse: response,
        efficiency: 'low',
        usage: 85
      });

      setPrompt('');

      // Process all updates in one centralized place
      processResponseUpdates(false, { usage: 85, efficiency: 'low' });
      return;
    }

    // Normal flow for valid prompts
    const submittedPrompt = prompt;
    setPrompt('');

    console.log("Sending prompt to API:", submittedPrompt);
    const result = await sendMessage(submittedPrompt);
    console.log("API response:", result);

    if (result?.success) {
      // Determine if this was an eco-responsible prompt based on the metrics
      // Check if isEcoResponsible was directly returned, otherwise use the efficiency
      const isEcoResponsible = 'isEcoResponsible' in result
          ? result.isEcoResponsible
          : result.metrics.efficiency === 'high';

      console.log("Prompt eco-responsible:", isEcoResponsible);

      // Process all updates in one centralized place
      processResponseUpdates(isEcoResponsible, result.metrics);
    }
  };

  const getTextAreaClasses = () => {
    const baseClasses = "flex-1 bg-background-darker border rounded-md px-4 py-2 text-white resize-none focus:outline-none focus:ring-2 focus:border-transparent";

    switch (promptStatus.status) {
      case 'valid':
        return `${baseClasses} textarea-valid`;
      case 'warning':
        return `${baseClasses} textarea-warning`;
      case 'error':
        return `${baseClasses} textarea-error`;
      default:
        return `${baseClasses} border-gray-700 focus:ring-primary-500`;
    }
  };

  const getButtonClasses = () => {
    if (isLoading || !prompt.trim()) {
      return 'ml-2 p-2 rounded-md bg-gray-800 text-gray-500 cursor-not-allowed';
    }

    switch (promptStatus.status) {
      case 'valid':
        return 'ml-2 p-2 rounded-md bg-green-600 text-white hover:bg-green-700';
      case 'warning':
        return 'ml-2 p-2 rounded-md bg-amber-600 text-white hover:bg-amber-700';
      case 'error':
        return 'ml-2 p-2 rounded-md bg-red-600 text-white hover:bg-red-700';
      default:
        return 'ml-2 p-2 rounded-md bg-primary-600 text-white hover:bg-primary-700';
    }
  };

  return (
      <div className={`chat-container bg-background-card rounded-lg shadow-lg ${className}`}>
        <div className="p-4 bg-background-darker/50 border-b border-primary-900/30 flex items-center">
          <Zap className="w-5 h-5 text-primary-500 mr-2" />
          <h2 className="font-bold text-lg text-white">Eco-Conscious AI Chat</h2>

          <button
              onClick={handleResetChat}
              className="ml-4 flex items-center px-3 py-1 text-xs rounded-md bg-background-darker hover:bg-gray-800 text-gray-300 transition-colors"
              title="Reset Chat (Ctrl+R)"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Reset
          </button>

          {user && (
              <div className="ml-auto flex items-center text-sm">
                <div className="flex items-center bg-primary-900/40 text-primary-400 px-2 py-1 rounded">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  <span>Level {user.level}</span>
                </div>
              </div>
          )}
        </div>

        <div className="chat-messages">
          {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <Zap className="w-12 h-12 text-primary-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Welcome to GreenPoint</h3>
                <p className="text-gray-400 max-w-md">
                  Start chatting with our energy-conscious AI. Your prompts will be analyzed for efficiency
                  and will contribute to your team's score!
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3 w-full max-w-md">
                  <div className="bg-background-darker p-3 rounded-md">
                    <div className="text-xs text-gray-500 mb-1">Efficient Prompts</div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm">Boost your level</span>
                    </div>
                  </div>
                  <div className="bg-background-darker p-3 rounded-md">
                    <div className="text-xs text-gray-500 mb-1">Inefficient Prompts</div>
                    <div className="flex items-center">
                      <AlertTriangle className="w-4 h-4 text-amber-500 mr-1" />
                      <span className="text-sm">Slower progress</span>
                    </div>
                  </div>
                </div>
              </div>
          ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </div>
          )}
        </div>

        {currentMetrics && <ChatFeedback metrics={currentMetrics} />}

        <div className="chat-input-container">
          <PromptStatusIndicator status={promptStatus} />

          <form onSubmit={handleSubmit} className="flex items-end">
          <textarea
              ref={inputRef}
              className={getTextAreaClasses()}
              placeholder="Type your prompt here..."
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
          />
            <button
                type="submit"
                className={getButtonClasses()}
                disabled={isLoading || !prompt.trim()}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
  );
};

export default ChatContainer;