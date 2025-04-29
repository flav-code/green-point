import React from 'react';
import { AlertTriangle, CheckCircle, Info, Lightbulb } from 'lucide-react';
import { EnergyMetrics } from '../../types';

interface ChatFeedbackProps {
  metrics: EnergyMetrics;
}

const ChatFeedback: React.FC<ChatFeedbackProps> = ({ metrics }) => {
  let icon;
  let title;
  let bgClass;
  let borderClass;
  
  // Style based on efficiency
  switch (metrics.efficiency) {
    case 'high':
      icon = <CheckCircle className="w-5 h-5 text-green-500" />;
      title = 'Excellent Prompt Efficiency';
      bgClass = 'bg-green-950/30';
      borderClass = 'border-green-900';
      break;
    case 'medium':
      icon = <Info className="w-5 h-5 text-amber-500" />;
      title = 'Average Prompt Efficiency';
      bgClass = 'bg-amber-950/30';
      borderClass = 'border-amber-900';
      break;
    case 'low':
      icon = <AlertTriangle className="w-5 h-5 text-red-500" />;
      title = 'Low Prompt Efficiency';
      bgClass = 'bg-red-950/30';
      borderClass = 'border-red-900';
      break;
  }
  
  const renderUsageMeter = () => {
    // Energy usage visualization (0-100)
    const usagePercentage = metrics.usage;
    
    // Determine color based on usage value
    let barColor;
    if (usagePercentage < 30) barColor = 'bg-green-500';
    else if (usagePercentage < 60) barColor = 'bg-amber-500';
    else barColor = 'bg-red-500';
    
    return (
      <div className="mt-1">
        <div className="flex items-center justify-between text-xs mb-1">
          <span>Energy Usage:</span>
          <span className="font-medium">{usagePercentage}/100</span>
        </div>
        <div className="w-full bg-background-darker rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${barColor}`}
            style={{ width: `${usagePercentage}%` }}
          ></div>
        </div>
      </div>
    );
  };
  
  return (
    <div className={`p-3 ${bgClass} border ${borderClass} mx-4 mb-4 rounded-md`}>
      <div className="flex items-start">
        <div className="mr-3 mt-0.5">
          {icon}
        </div>
        
        <div className="flex-1">
          <h3 className="font-medium">{title}</h3>
          
          {renderUsageMeter()}
          
          {metrics.suggestions && metrics.suggestions.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center text-sm mb-1">
                <Lightbulb className="w-4 h-4 text-amber-500 mr-1" />
                <span className="font-medium">Suggestions for improvement:</span>
              </div>
              
              <ul className="list-disc list-inside text-sm pl-1 space-y-1">
                {metrics.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-gray-300">{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatFeedback;