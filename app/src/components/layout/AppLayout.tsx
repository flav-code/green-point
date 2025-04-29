import React from 'react';
import { Leaf } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background-dark text-white">
      <header className="bg-background-darker py-4 border-b border-primary-700/30">
        <div className="container mx-auto px-4 flex items-center">
          <Leaf className="h-8 w-8 text-primary-500 mr-2" />
          <h1 className="text-2xl font-bold text-primary-400">GreenPoint</h1>
          <span className="ml-2 text-sm text-primary-200/80">AI Sustainability Platform</span>
          <div className="ml-auto">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-900/50 border border-primary-700/50 text-primary-400 text-xs">
              <div className="w-2 h-2 rounded-full bg-primary-500 mr-2 animate-pulse-slow"></div>
              <span>Energy-Conscious AI</span>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
      
      <footer className="bg-background-darker py-3 border-t border-primary-900/50 mt-10">
        <div className="container mx-auto px-4 text-center text-xs text-gray-500">
          <p>© 2025 GreenPoint - Making AI sustainable, one prompt at a time</p>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;