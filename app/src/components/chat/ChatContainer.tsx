import React, { useState, useRef, useEffect } from 'react';
import { Send, Zap, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { useUser } from '../../hooks/useUser';
import ChatMessage from './ChatMessage';
import ChatFeedback from './ChatFeedback';

interface ChatContainerProps {
  className?: string;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ className = '' }) => {
  const { messages, isLoading, currentMetrics, sendMessage } = useChat();
  const { user, checkAchievements } = useUser();
  const [prompt, setPrompt] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    
    const submittedPrompt = prompt;
    setPrompt('');
    
    const result = await sendMessage(submittedPrompt);
    
    if (result?.success) {
      // Check for achievements
      checkAchievements({
        promptSubmitted: true,
        efficientPrompt: result.metrics.efficiency === 'high'
      });
    }
  };
  
  return (
    <div className={`flex flex-col bg-background-card rounded-lg shadow-lg overflow-hidden ${className}`}>
      <div className="p-4 bg-background-darker/50 border-b border-primary-900/30 flex items-center">
        <Zap className="w-5 h-5 text-primary-500 mr-2" />
        <h2 className="font-bold text-lg text-white">Eco-Conscious AI Chat</h2>
        {user && (
          <div className="ml-auto flex items-center text-sm">
            <div className="flex items-center bg-primary-900/40 text-primary-400 px-2 py-1 rounded">
              <BarChart3 className="w-4 h-4 mr-1" />
              <span>Level {user.level}</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto max-h-[calc(100vh-22rem)]">
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
      
      <div className="p-4 border-t border-primary-900/30 bg-background-darker/30">
        <form onSubmit={handleSubmit} className="flex items-end">
          <textarea
            className="flex-1 bg-background-darker border border-gray-700 rounded-md px-4 py-2 text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Type your prompt here..."
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            className={`ml-2 p-2 rounded-md ${
              isLoading || !prompt.trim()
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
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