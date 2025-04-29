import React from 'react';
import { Award, Star, TrendingUp, CircleOff } from 'lucide-react';
import { User } from '../../types';
import CardContainer from '../layout/CardContainer';

interface AchievementsCardProps {
  user: User;
}

const AchievementsCard: React.FC<AchievementsCardProps> = ({ user }) => {
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
  
  const getAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case 'award': return <Award className="w-4 h-4" />;
      case 'zap': return <Star className="w-4 h-4" />;
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
            className="h-2 rounded-full bg-gradient-to-r from-primary-600 to-primary-500" 
            style={{ width: `${levelProgressPercentage}%` }}
          ></div>
        </div>
      </div>
      
      <div className="space-y-3">
        {achievements.length > 0 ? (
          achievements.slice(0, 4).map((achievement) => {
            const isUnlocked = !!achievement.unlockedAt;
            const progressPercentage = achievement.progress && achievement.maxProgress 
              ? (achievement.progress / achievement.maxProgress) * 100 
              : 0;
            
            return (
              <div 
                key={achievement.id} 
                className={`p-2 rounded-md ${isUnlocked ? 'bg-primary-900/20' : 'bg-background-darker'}`}
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
                            className="h-1 rounded-full bg-secondary-700" 
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