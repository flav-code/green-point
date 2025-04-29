import React, { useState, useEffect } from 'react';
import { Award, Star, TrendingUp, CircleOff, Leaf } from 'lucide-react';
import { User } from '../../types';
import CardContainer from '../layout/CardContainer';
import { getUser } from '../../utils/localStorage';

interface AchievementsCardProps {
  user: User;
}

const AchievementsCard: React.FC<AchievementsCardProps> = ({ user: initialUser }) => {
  const [user, setUser] = useState<User>(initialUser);
  const [flashAchievement, setFlashAchievement] = useState<string | null>(null);

  // Listen for achievement unlocks
  useEffect(() => {
    const handleAchievementUnlocked = (event: Event) => {
      const customEvent = event as CustomEvent<{ achievementId: string }>;
      console.log("Achievement unlocked:", customEvent.detail);

      // Flash the newly unlocked achievement
      setFlashAchievement(customEvent.detail.achievementId);

      // Clear the flash after 3 seconds
      setTimeout(() => {
        setFlashAchievement(null);
      }, 3000);

      // Refresh user data
      const updatedUser = getUser();
      if (updatedUser) {
        setUser(updatedUser);
      }
    };

    // Listen for achievements and general updates
    window.addEventListener('achievement-unlocked', handleAchievementUnlocked);
    window.addEventListener('user-data-updated', () => {
      const updatedUser = getUser();
      if (updatedUser) {
        setUser(updatedUser);
      }
    });

    return () => {
      window.removeEventListener('achievement-unlocked', handleAchievementUnlocked);
      window.removeEventListener('user-data-updated', () => {});
    };
  }, []);

  // Determine which achievements to show (unlocked ones first, then in-progress ones)
  const achievements = [...user.achievements].sort((a, b) => {
    // Unlocked achievements at the top
    if (a.unlockedAt && !b.unlockedAt) return -1;
    if (!a.unlockedAt && b.unlockedAt) return 1;

    // For unlocked achievements, most recent first
    if (a.unlockedAt && b.unlockedAt) {
      return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
    }

    // For locked achievements, sort by progress percentage
    const aProgress = a.progress && a.maxProgress ? (a.progress / a.maxProgress) : 0;
    const bProgress = b.progress && b.maxProgress ? (b.progress / b.maxProgress) : 0;

    return bProgress - aProgress;
  });

  // Calculate level progress percentage
  const levelProgressPercentage = (user.xp / user.xpToNextLevel) * 100;

  // Get current eco-streak
  const currentEcoStreak = user.stats.ecoResponsibleStreak || 0;

  const getAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case 'award': return <Award className="w-4 h-4" />;
      case 'zap': return <Star className="w-4 h-4" />;
      case 'leaf': return <Leaf className="w-4 h-4" />;
      case 'sparkles': return <TrendingUp className="w-4 h-4" />;
      default: return <Award className="w-4 h-4" />;
    }
  };

  return (
      <CardContainer title="Achievements & Level" icon={<Award className="w-5 h-5 text-yellow-500" />}>
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-900 text-primary-300 font-bold mr-2">
                {user.level}
              </div>
              <div>
                <div className="text-sm font-medium">Level {user.level}</div>
                <div className="text-xs text-gray-500">
                  {user.xp} / {user.xpToNextLevel} XP
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {Math.round(levelProgressPercentage)}%
            </div>
          </div>

          <div className="mt-2 bg-background-darker rounded-full h-2">
            <div
                className="h-2 rounded-full bg-gradient-to-r from-primary-600 to-primary-500 transition-all duration-500"
                style={{ width: `${levelProgressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Eco-Responsible Streak Display */}
        <div className="mb-4 p-3 bg-primary-900/20 rounded-md">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary-800 text-primary-300 mr-3">
              <Leaf className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">
                Eco-Responsible Streak
              </div>
              <div className="text-2xl font-bold text-primary-400 mt-1">
                {currentEcoStreak}
              </div>
            </div>
          </div>
          {currentEcoStreak > 0 && (
              <div className="text-xs text-primary-300 mt-2">
                {currentEcoStreak >= 20
                    ? "Amazing! You're a true eco-champion!"
                    : currentEcoStreak >= 5
                        ? "Great job! Keep those eco-friendly prompts coming!"
                        : "Good start! Keep using efficient prompts."}
              </div>
          )}
        </div>

        <div className="space-y-3">
          {achievements.length > 0 ? (
              achievements.slice(0, 4).map((achievement) => {
                const isUnlocked = !!achievement.unlockedAt;
                const progressPercentage = achievement.progress && achievement.maxProgress
                    ? (achievement.progress / achievement.maxProgress) * 100
                    : 0;
                const isFlashing = flashAchievement === achievement.id;

                return (
                    <div
                        key={achievement.id}
                        className={`p-2 rounded-md ${
                            isUnlocked
                                ? 'bg-primary-900/20'
                                : 'bg-background-darker'
                        } ${
                            isFlashing
                                ? 'animate-pulse border border-yellow-500'
                                : ''
                        } transition-all duration-300`}
                    >
                      <div className="flex items-start">
                        <div className={`flex items-center justify-center rounded-md w-8 h-8 mr-3 ${
                            isUnlocked
                                ? 'bg-primary-800 text-primary-300'
                                : 'bg-gray-800 text-gray-500'
                        }`}>
                          {getAchievementIcon(achievement.icon)}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center">
                            <div className="font-medium text-sm">
                              {achievement.title}
                            </div>
                            {isUnlocked && (
                                <div className="ml-2 text-xs bg-primary-800 text-primary-300 px-1.5 py-0.5 rounded">
                                  Unlocked
                                </div>
                            )}
                          </div>

                          <div className="text-xs text-gray-500 mt-0.5">
                            {achievement.description}
                          </div>

                          {!isUnlocked && achievement.progress !== undefined && achievement.maxProgress !== undefined && (
                              <div className="mt-1.5">
                                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                  <span>Progress</span>
                                  <span>{achievement.progress} / {achievement.maxProgress}</span>
                                </div>
                                <div className="w-full bg-gray-800 rounded-full h-1">
                                  <div
                                      className="h-1 rounded-full bg-secondary-700 transition-all duration-500"
                                      style={{ width: `${progressPercentage}%` }}
                                  ></div>
                                </div>
                              </div>
                          )}
                        </div>
                      </div>
                    </div>
                );
              })
          ) : (
              <div className="text-center p-6">
                <CircleOff className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No achievements yet. Start using the AI to earn achievements!</p>
              </div>
          )}
        </div>
      </CardContainer>
  );
};

export default AchievementsCard;