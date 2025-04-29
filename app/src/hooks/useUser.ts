import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import {
  getUser,
  createUser,
  saveUser,
  addUserXP,
  updateAchievement,
  updateEcoStreak,
  updateEcoAchievements,
  getAvailableAchievements
} from '../utils/localStorage';

export const useUser = () => {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user on initial render
  useEffect(() => {
    const loadedUser = getUser();

    // If we have a user but their achievements aren't initialized
    if (loadedUser && (!loadedUser.achievements || loadedUser.achievements.length === 0)) {
      // Initialize with default achievements
      loadedUser.achievements = getAvailableAchievements();
      saveUser(loadedUser);
    }

    // Make sure ecoResponsibleStreak is initialized
    if (loadedUser && !loadedUser.stats.ecoResponsibleStreak) {
      loadedUser.stats.ecoResponsibleStreak = 0;
      saveUser(loadedUser);
    }

    setUserState(loadedUser);
    setIsLoading(false);
  }, []);

  // Create new user
  const createNewUser = useCallback((name: string, teamId: string) => {
    const newUser = createUser(name, teamId);
    setUserState(newUser);
    return newUser;
  }, []);

  // Update user state from localStorage
  const refreshUser = useCallback(() => {
    const freshUser = getUser();
    if (freshUser) {
      setUserState(freshUser);
    }
    return freshUser;
  }, []);

  // Set user directly (for updates)
  const setUser = useCallback((updatedUser: User) => {
    saveUser(updatedUser);
    setUserState(updatedUser);
  }, []);

  // Update user level and XP
  const addXP = useCallback((amount: number) => {
    if (!user) return false;

    const didLevelUp = addUserXP(amount);
    refreshUser(); // Refresh user data

    return didLevelUp;
  }, [user, refreshUser]);

  // Check and process achievements
  const checkAchievements = useCallback((actions: {
    promptSubmitted?: boolean;
    efficientPrompt?: boolean;
    ecoResponsiblePrompt?: boolean;
    resetEcoStreak?: boolean;
    inefficientImproved?: boolean;
  }) => {
    if (!user) return;

    // Process each possible achievement type
    if (actions.promptSubmitted) {
      updateAchievement('prompt-master', 1);

      // Update team score for each prompt
      // This happens in the updateUserStats function
    }

    // Handle eco-responsible streaks
    if (actions.ecoResponsiblePrompt) {
      // Increment the streak counter
      const newStreak = updateEcoStreak(true);

      // Update achievements based on streak
      updateEcoAchievements(newStreak);
    } else if (actions.resetEcoStreak) {
      // Reset the streak counter
      updateEcoStreak(false);
    }

    // Handle efficiency streak
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
        setUserState(updatedUser);
      }
    }

    if (actions.inefficientImproved) {
      updateAchievement('optimization-expert', 1);
    }

    // Refresh user data to get updated achievements
    refreshUser();
  }, [user, refreshUser]);

  return {
    user,
    setUser,
    isLoading,
    createNewUser,
    addXP,
    checkAchievements,
    refreshUser
  };
};