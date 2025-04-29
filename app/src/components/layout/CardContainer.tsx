import React from 'react';

interface CardContainerProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const CardContainer: React.FC<CardContainerProps> = ({ 
  title, 
  children, 
  icon,
  className = '' 
}) => {
  return (
    <div className={`bg-background-card rounded-lg shadow-lg overflow-hidden mb-4 ${className}`}>
      <div className="px-4 py-3 bg-background-darker/50 border-b border-primary-900/30 flex items-center">
        {icon && <div className="mr-2">{icon}</div>}
        <h2 className="font-bold text-lg text-secondary-200">{title}</h2>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

export default CardContainer;