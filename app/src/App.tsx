import React, { useState, useEffect } from 'react';
import AppLayout from './components/layout/AppLayout';
import UserOnboarding from './components/onboarding/UserOnboarding';
import TeamLeaderboard from './components/teams/TeamLeaderboard';
import AnalyticsCard from './components/analytics/AnalyticsCard';
import AchievementsCard from './components/achievements/AchievementsCard';
import ChatContainer from './components/chat/ChatContainer';
import { useUser } from './hooks/useUser';

function App() {
  const { user, isLoading } = useUser();
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  useEffect(() => {
    if (!isLoading && !user) {
      setShowOnboarding(true);
    }
  }, [isLoading, user]);
  
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[70vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-6 text-xl font-medium text-gray-400">Loading GreenPoint...</p>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  if (showOnboarding) {
    return (
      <AppLayout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <UserOnboarding onComplete={() => setShowOnboarding(false)} />
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left side stacked cards */}
        <div className="md:w-1/3 space-y-6 flex flex-col">
          <TeamLeaderboard />
          
          {user && (
            <>
              <AnalyticsCard user={user} />
              <AchievementsCard user={user} />
            </>
          )}
        </div>
        
        {/* Right side chat interface */}
        <div className="md:w-2/3">
          <ChatContainer className="h-full" />
        </div>
      </div>
    </AppLayout>
  );
}

export default App;