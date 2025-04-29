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
    const loadUser = () => {
      const loadedUser = getUser();
      console.log("Initial user load:", loadedUser ? "Found user" : "No user found");

      // If we have a user but their achievements aren't initialized
      if (loadedUser && (!loadedUser.achievements || loadedUser.achievements.length === 0)) {
        console.log("Initializing user achievements");
        // Initialize with default achievements
        loadedUser.achievements = getAvailableAchievements();
        saveUser(loadedUser);
      }

      // Make sure ecoResponsibleStreak is initialized
      if (loadedUser && !loadedUser.stats.ecoResponsibleStreak) {
        console.log("Initializing eco streak");
        loadedUser.stats.ecoResponsibleStreak = 0;
        saveUser(loadedUser);
      }

      setUserState(loadedUser);
      setIsLoading(false);
    };

    loadUser();
  }, []);

  // Listen for user data update events
  useEffect(() => {
    const handleUserDataUpdate = () => {
      console.log("User data update detected, refreshing user");
      refreshUser();
    };

    window.addEventListener('user-data-updated', handleUserDataUpdate);
    window.addEventListener('user-stats-updated', handleUserDataUpdate);
    window.addEventListener('achievement-unlocked', handleUserDataUpdate);

    return () => {
      window.removeEventListener('user-data-updated', handleUserDataUpdate);
      window.removeEventListener('user-stats-updated', handleUserDataUpdate);
      window.removeEventListener('achievement-unlocked', handleUserDataUpdate);
    };
  }, []);

  // Create new user
  const createNewUser = useCallback((name: string, teamId: string) => {
    console.log(`Creating new user: ${name}, Team: ${teamId}`);
    const newUser = createUser(name, teamId);
    setUserState(newUser);
    return newUser;
  }, []);

  // Update user state from localStorage
  const refreshUser = useCallback(() => {
    const freshUser = getUser();
    console.log("Refreshing user data:", freshUser);
    if (freshUser) {
      setUserState(freshUser);
    }
    return freshUser;
  }, []);

  // Set user directly (for updates)
  const setUser = useCallback((updatedUser: User) => {
    console.log("Setting updated user:", updatedUser);
    saveUser(updatedUser);
    setUserState(updatedUser);
  }, []);

  // Update user level and XP
  const addXP = useCallback((amount: number) => {
    if (!user) return false;

    console.log(`Adding ${amount} XP to user`);
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

    console.log("Checking achievements for actions:", actions);

    // Process each possible achievement type
    if (actions.promptSubmitted) {
      console.log("Processing prompt submission achievement");
      updateAchievement('first-prompt', 1, user.stats.totalPrompts === 0);
      updateAchievement('prompt-master', 1);

      // Update team contribution achievement
      if (actions.efficientPrompt) {
        updateAchievement('team-contributor', 1);
      }
    }

    // Handle eco-responsible streaks
    if (actions.ecoResponsiblePrompt) {
      console.log("Processing eco-responsible prompt");
      // Increment the streak counter
      const newStreak = updateEcoStreak(true);
      console.log(`Eco streak increased to ${newStreak}`);

      // Update achievements based on streak
      updateEcoAchievements(newStreak);
    } else if (actions.resetEcoStreak) {
      console.log("Resetting eco streak");
      // Reset the streak counter
      updateEcoStreak(false);
    }

    // Handle efficiency streak
    if (actions.efficientPrompt) {
      console.log("Processing efficiency streak");
      updateAchievement('efficiency-streak', 1);
    } else if (actions.efficientPrompt === false) {
      console.log("Resetting efficiency streak");
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
      console.log("Processing optimization achievement");
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