import React, { useState, useEffect } from 'react';
import AppLayout from './components/layout/AppLayout';
import UserOnboarding from './components/onboarding/UserOnboarding';
import TeamLeaderboard from './components/teams/TeamLeaderboard';
import AnalyticsCard from './components/analytics/AnalyticsCard';
import AchievementsCard from './components/achievements/AchievementsCard';
import ChatContainer from './components/chat/ChatContainer';
import { useUser } from './hooks/useUser';

function App() {
    const { user, isLoading, setUser } = useUser();
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) {
            setShowOnboarding(true);
        } else if (!isLoading && user && !user.achievements.length) {
            // Ensure user has achievements initialized
            const updatedUser = { ...user, achievements: [] };
            setUser(updatedUser);
        }
    }, [isLoading, user, setUser]);

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
            <div className="flex flex-col lg:flex-row gap-6 h-[80vh]">
                {/* Left side scrollable sidebar with cards */}
                <div className="lg:w-1/3 flex flex-col h-full">
                    <div className="overflow-y-auto pr-2 flex-1">
                        <div className="space-y-6">
                            <TeamLeaderboard />

                            {user && (
                                <>
                                    <AnalyticsCard user={user} />
                                    <AchievementsCard user={user} />
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right side chat interface */}
                <div className="lg:w-2/3 h-full flex-1">
                    <ChatContainer className="h-full" />
                </div>
            </div>
        </AppLayout>
    );
}

export default App;