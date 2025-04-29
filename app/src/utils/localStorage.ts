import { User, Team, Achievement, ChatMessage } from "../types";
import teamsData from "../data/teams.json";
import achievementsData from "../data/achievements.json";
import { v4 as uuidv4 } from "uuid";
import {dispatchUpdateEvent} from "../components/chat/updateService.ts";

const USER_KEY = "greenpoint_user";
const TEAMS_KEY = "greenpoint_teams";
const MESSAGES_KEY = "greenpoint_messages";
const ECO_STREAK_KEY = "greenpoint_eco_streak";

// Initialize or get user data
export const getUser = (): User | null => {
  const userData = localStorage.getItem(USER_KEY);
  return userData ? JSON.parse(userData) : null;
};

// Create new user
export const createUser = (name: string, teamId: string): User => {
  // Initialize achievements with the predefined ones from data
  const initialAchievements = [
    ...achievementsData,
    // Add new eco-responsible achievements if not already included
    {
      id: "first-eco-prompt",
      title: "First Eco-Responsible Prompt",
      description: "Submit your first eco-responsible prompt",
      icon: "leaf",
      progress: 0,
      maxProgress: 1
    },
    {
      id: "eco-streak-5",
      title: "Eco Streak: Beginner",
      description: "Submit 5 eco-responsible prompts in a row",
      icon: "award",
      progress: 0,
      maxProgress: 5
    },
    {
      id: "eco-streak-20",
      title: "Eco Streak: Master",
      description: "Submit 20 eco-responsible prompts in a row",
      icon: "award",
      progress: 0,
      maxProgress: 20
    }
  ].filter((achievement, index, self) =>
      index === self.findIndex(a => a.id === achievement.id)
  );

  const newUser: User = {
    id: uuidv4(),
    name,
    teamId,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    joinDate: new Date().toISOString(),
    stats: {
      totalPrompts: 0,
      efficientPrompts: 0,
      inefficientPrompts: 0,
      averageEnergy: 0,
      dailyPrompts: {},
      dailyEnergy: {},
      ecoResponsibleStreak: 0
    },
    achievements: initialAchievements
  };

  // Initialize eco streak in separate storage
  localStorage.setItem(ECO_STREAK_KEY, "0");

  localStorage.setItem(USER_KEY, JSON.stringify(newUser));
  // Dispatch event to notify of user creation
  dispatchUpdateEvent('user-data-updated', { userId: newUser.id });

  return newUser;
};

// Save user data
export const saveUser = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  // Dispatch event to notify of user update
  dispatchUpdateEvent('user-data-updated', { userId: user.id });
};

// Set user data (for external hooks)
export const setUser = (user: User): void => {
  saveUser(user);
};

// Get teams data (initialized from static data if not in localStorage)
export const getTeams = (): Team[] => {
  const teamsString = localStorage.getItem(TEAMS_KEY);
  if (teamsString) {
    return JSON.parse(teamsString);
  }

  // Initialize from static data
  localStorage.setItem(TEAMS_KEY, JSON.stringify(teamsData));
  return teamsData as Team[];
};

// Update team score
export const updateTeamScore = (teamId: string, pointsToAdd: number): void => {
  const teams = getTeams();
  const teamIndex = teams.findIndex(team => team.id === teamId);

  if (teamIndex === -1) {
    console.error(`Team not found with id: ${teamId}`);
    return;
  }

  const updatedTeam = { ...teams[teamIndex] };
  updatedTeam.score += pointsToAdd;

  // Ensure score doesn't go negative
  if (updatedTeam.score < 0) updatedTeam.score = 0;

  // Update the team in the array
  teams[teamIndex] = updatedTeam;

  // Save updated teams
  localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));

  // Dispatch event for team score update
  dispatchUpdateEvent('team-score-updated', {
    teamId: teamId,
    newScore: updatedTeam.score,
    pointChange: pointsToAdd
  });
};

// Get chat messages
export const getChatMessages = (): ChatMessage[] => {
  const messagesString = localStorage.getItem(MESSAGES_KEY);
  return messagesString ? JSON.parse(messagesString) : [];
};

// Save chat message
export const saveChatMessage = (message: ChatMessage): void => {
  const messages = getChatMessages();
  const updatedMessages = [...messages, message];
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(updatedMessages));
};

// Clear all chat messages
export const clearChatMessages = (): void => {
  localStorage.removeItem(MESSAGES_KEY);
};

// Get list of available achievements
export const getAvailableAchievements = (): Achievement[] => {
  const defaultAchievements = [
    ...achievementsData,
    {
      id: "first-eco-prompt",
      title: "First Eco-Responsible Prompt",
      description: "Submit your first eco-responsible prompt",
      icon: "leaf",
      progress: 0,
      maxProgress: 1
    },
    {
      id: "eco-streak-5",
      title: "Eco Streak: Beginner",
      description: "Submit 5 eco-responsible prompts in a row",
      icon: "award",
      progress: 0,
      maxProgress: 5
    },
    {
      id: "eco-streak-20",
      title: "Eco Streak: Master",
      description: "Submit 20 eco-responsible prompts in a row",
      icon: "award",
      progress: 0,
      maxProgress: 20
    }
  ].filter((achievement, index, self) =>
      index === self.findIndex(a => a.id === achievement.id)
  );

  return defaultAchievements;
};

// Get user's current eco-streak
export const getEcoStreak = (): number => {
  // First try to get from localStorage
  const streakFromStorage = localStorage.getItem(ECO_STREAK_KEY);
  if (streakFromStorage) {
    return parseInt(streakFromStorage, 10);
  }

  // Fall back to user stats if not in separate storage
  const user = getUser();
  const streak = user?.stats?.ecoResponsibleStreak || 0;

  // Initialize storage if missing
  localStorage.setItem(ECO_STREAK_KEY, streak.toString());

  return streak;
};

// Update eco-streak count
export const updateEcoStreak = (increment: boolean): number => {
  // Get current streak
  const currentStreak = getEcoStreak();

  // Calculate new streak
  const newStreak = increment ? currentStreak + 1 : 0;

  // Save to localStorage
  localStorage.setItem(ECO_STREAK_KEY, newStreak.toString());

  // Also update user object
  const user = getUser();
  if (user) {
    const updatedStats = {
      ...user.stats,
      ecoResponsibleStreak: newStreak
    };

    const updatedUser = { ...user, stats: updatedStats };
    saveUser(updatedUser);
  }

  return newStreak;
};

// Get user's unlocked achievements
export const getUserAchievements = (): Achievement[] => {
  const user = getUser();
  return user ? user.achievements : [];
};

// Update an achievement's progress
export const updateAchievement = (
    achievementId: string,
    incrementProgress: number = 0,
    forceUnlock: boolean = false
): Achievement | null => {
  const user = getUser();
  if (!user) return null;

  // Find the achievement to update
  const availableAchievements = getAvailableAchievements();
  const achievementTemplate = availableAchievements.find(a => a.id === achievementId);

  if (!achievementTemplate) return null;

  // Check if user already has this achievement
  const existingIndex = user.achievements.findIndex(a => a.id === achievementId);
  let achievement: Achievement | null = null;
  let wasUnlocked = false;

  if (existingIndex >= 0) {
    // Achievement exists, update progress
    achievement = { ...user.achievements[existingIndex] };

    // Only update progress if it's not already unlocked
    if (!achievement.unlockedAt && achievement.progress !== undefined && achievement.maxProgress !== undefined) {
      achievement.progress = Math.min((achievement.progress || 0) + incrementProgress, achievement.maxProgress);

      // Check if achievement should be unlocked
      if (forceUnlock || achievement.progress >= achievement.maxProgress) {
        achievement.unlockedAt = new Date().toISOString();
        wasUnlocked = true;

        // Add XP for completing achievement
        user.xp += 50;

        // Check for level up
        if (user.xp >= user.xpToNextLevel) {
          user.level += 1;
          user.xp = user.xp - user.xpToNextLevel;
          user.xpToNextLevel = Math.round(user.xpToNextLevel * 1.2);
        }
      }

      // Update the user's achievements
      const updatedAchievements = [...user.achievements];
      updatedAchievements[existingIndex] = achievement;

      const updatedUser = { ...user, achievements: updatedAchievements };
      saveUser(updatedUser);
    }
  } else {
    // Achievement doesn't exist for user, add it
    achievement = { ...achievementTemplate };

    // If it has progress, update it
    if (incrementProgress > 0 && achievement.progress !== undefined) {
      achievement.progress = incrementProgress;

      // Check if it should be unlocked immediately
      if (forceUnlock || (achievement.progress >= (achievement.maxProgress || 0))) {
        achievement.unlockedAt = new Date().toISOString();
        wasUnlocked = true;

        // Add XP for completing achievement
        user.xp += 50;

        // Check for level up
        if (user.xp >= user.xpToNextLevel) {
          user.level += 1;
          user.xp = user.xp - user.xpToNextLevel;
          user.xpToNextLevel = Math.round(user.xpToNextLevel * 1.2);
        }
      }
    } else if (forceUnlock) {
      achievement.unlockedAt = new Date().toISOString();
      wasUnlocked = true;

      // Add XP for completing achievement
      user.xp += 50;

      // Check for level up
      if (user.xp >= user.xpToNextLevel) {
        user.level += 1;
        user.xp = user.xp - user.xpToNextLevel;
        user.xpToNextLevel = Math.round(user.xpToNextLevel * 1.2);
      }
    }

    // Add to user's achievements
    const updatedUser = {
      ...user,
      achievements: [...user.achievements, achievement]
    };

    saveUser(updatedUser);
  }

  // If achievement was unlocked, dispatch an event
  if (wasUnlocked && achievement) {
    dispatchUpdateEvent('achievement-unlocked', {
      achievementId: achievement.id,
      achievementName: achievement.title
    });
  }

  return achievement;
};

// Update eco-responsible achievements based on the current streak
export const updateEcoAchievements = (streak: number): void => {
  if (streak === 1) {
    // First eco-responsible prompt
    updateAchievement("first-eco-prompt", 1);
  }

  // Update streak achievements
  if (streak <= 5) {
    updateAchievement("eco-streak-5", 1);
  }

  if (streak <= 20) {
    updateAchievement("eco-streak-20", 1);
  }
};

// Update user stats with new prompt information
export const updateUserStats = (
    energyUsage: number,
    efficiency: 'high' | 'medium' | 'low'
): Record<string, any> => {
  const user = getUser();
  if (!user) return {};

  const today = new Date().toISOString().split('T')[0];
  const isEfficient = efficiency === 'high';

  // Update daily stats
  const dailyPrompts = { ...user.stats.dailyPrompts };
  dailyPrompts[today] = (dailyPrompts[today] || 0) + 1;

  const dailyEnergy = { ...user.stats.dailyEnergy };
  dailyEnergy[today] = (dailyEnergy[today] || 0) + energyUsage;

  // Calculate new average energy
  const totalPrompts = user.stats.totalPrompts + 1;
  const totalEnergy = user.stats.averageEnergy * user.stats.totalPrompts + energyUsage;
  const newAverage = totalEnergy / totalPrompts;

  // Update user stats
  const updatedStats = {
    ...user.stats,
    totalPrompts,
    efficientPrompts: user.stats.efficientPrompts + (isEfficient ? 1 : 0),
    inefficientPrompts: user.stats.inefficientPrompts + (efficiency === 'low' ? 1 : 0),
    averageEnergy: newAverage,
    dailyPrompts,
    dailyEnergy
  };

  const updatedUser = { ...user, stats: updatedStats };

  // Add XP for the prompt (more for efficient prompts)
  const xpGain = isEfficient ? 15 : (efficiency === 'medium' ? 10 : 5);
  const newXP = updatedUser.xp + xpGain;

  // Check for level up
  if (newXP >= updatedUser.xpToNextLevel) {
    updatedUser.level += 1;
    updatedUser.xp = newXP - updatedUser.xpToNextLevel;
    updatedUser.xpToNextLevel = Math.round(updatedUser.xpToNextLevel * 1.5);

    // Add points to team for level up
    updateTeamScore(updatedUser.teamId, 50);
  } else {
    updatedUser.xp = newXP;
  }

  saveUser(updatedUser);

  // If this is a high-efficiency prompt, increment the eco streak
  if (isEfficient) {
    const newStreak = updateEcoStreak(true);
    updateEcoAchievements(newStreak);
  }

  return updatedStats;
};

// Add XP directly to user
export const addUserXP = (xpAmount: number): boolean => {
  const user = getUser();
  if (!user) return false;

  const newXP = user.xp + xpAmount;
  let didLevelUp = false;

  // Check for level up
  if (newXP >= user.xpToNextLevel) {
    user.level += 1;
    user.xp = newXP - user.xpToNextLevel;
    user.xpToNextLevel = Math.round(user.xpToNextLevel * 1.5);
    didLevelUp = true;

    // Add points to team for level up
    updateTeamScore(user.teamId, 50);
  } else {
    user.xp = newXP;
  }

  saveUser(user);

  return didLevelUp;
};