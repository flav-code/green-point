import React from 'react';
import { ChatMessage as ChatMessageType } from '../../types';
import { User, Bot, Zap } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  // Define classes based on message role
  const containerClasses = isUser 
    ? 'bg-secondary-900/30 border border-secondary-800/50' 
    : 'bg-background-darker border border-gray-800';
  
  const iconBgClass = isUser 
    ? 'bg-secondary-800' 
    : 'bg-primary-900';
  
  const iconTextClass = isUser 
    ? 'text-secondary-200' 
    : 'text-primary-300';
  
  // Energy efficiency indicator (for AI messages only)
  let efficiencyColor = '';
  if (!isUser && message.efficiency) {
    switch (message.efficiency) {
      case 'high': 
        efficiencyColor = 'bg-green-500';
        break;
      case 'medium': 
        efficiencyColor = 'bg-amber-500';
        break;
      case 'low': 
        efficiencyColor = 'bg-red-500';
        break;
    }
  }
  
  return (
    <div className={`p-3 rounded-lg ${containerClasses}`}>
      <div className="flex">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full ${iconBgClass} ${iconTextClass} flex items-center justify-center mr-3`}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center mb-1">
            <span className="font-medium text-sm">
              {isUser ? 'You' : 'GreenPoint AI'}
            </span>
            <span className="text-xs text-gray-500 ml-2">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
            
            {!isUser && message.efficiency && (
              <div className="ml-auto flex items-center">
                <div className={`w-2 h-2 rounded-full ${efficiencyColor} mr-1`}></div>
                <span className="text-xs uppercase">{message.efficiency}</span>
                
                {message.energyUsage !== undefined && (
                  <div className="ml-2 flex items-center text-xs bg-background-darker px-1.5 py-0.5 rounded">
                    <Zap className="w-3 h-3 mr-1" />
                    {message.energyUsage}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="text-sm whitespace-pre-line">
            {message.content}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;