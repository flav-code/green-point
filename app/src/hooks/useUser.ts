import { useState, useEffect } from 'react';
import { User } from '../types';
import { getUser, createUser, saveUser, addUserXP, updateAchievement } from '../utils/localStorage';

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load user on initial render
  useEffect(() => {
    const loadedUser = getUser();
    setUser(loadedUser);
    setIsLoading(false);
  }, []);
  
  // Create new user
  const createNewUser = (name: string, teamId: string) => {
    const newUser = createUser(name, teamId);
    setUser(newUser);
    
    // Unlock first achievement
    updateAchievement('first-prompt', 0, true);
    
    return newUser;
  };
  
  // Update user level and XP
  const addXP = (amount: number) => {
    if (!user) return false;
    
    const didLevelUp = addUserXP(amount);
    setUser(getUser()); // Refresh user data
    
    return didLevelUp;
  };
  
  // Check and process achievements
  const checkAchievements = (actions: {
    promptSubmitted?: boolean;
    efficientPrompt?: boolean;
    inefficientImproved?: boolean;
  }) => {
    if (!user) return;
    
    // Process each possible achievement type
    if (actions.promptSubmitted) {
      updateAchievement('prompt-master', 1);
    }
    
    if (actions.efficientPrompt) {
      updateAchievement('efficiency-streak', 1);
    } else if (actions.efficientPrompt === false) {
      // Reset efficiency streak on non-efficient prompt
      const achievement = user.achievements.find(a => a.id === 'efficiency-streak');
      if (achievement && !achievement.unlockedAt) {
        const updatedAchievement = { ...achievement, progress: 0 };
        const updatedAchievements = user.achievements.map(a => 
          a.id === 'efficiency-streak' ? updatedAchievement : a
        );
        
        const updatedUser = { ...user, achievements: updatedAchievements };
        saveUser(updatedUser);
        setUser(updatedUser);
      }
    }
    
    if (actions.inefficientImproved) {
      updateAchievement('optimization-expert', 1);
    }
    
    // Refresh user data to get updated achievements
    setUser(getUser());
  };
  
  return { 
    user, 
    isLoading, 
    createNewUser, 
    addXP,
    checkAchievements
  };
};