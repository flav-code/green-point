import { User, Team, Achievement, ChatMessage } from "../types";
import teamsData from "../data/teams.json";
import achievementsData from "../data/achievements.json";
import { v4 as uuidv4 } from "uuid";

const USER_KEY = "greenpoint_user";
const TEAMS_KEY = "greenpoint_teams";
const MESSAGES_KEY = "greenpoint_messages";

// Initialize or get user data
export const getUser = (): User | null => {
  const userData = localStorage.getItem(USER_KEY);
  return userData ? JSON.parse(userData) : null;
};

// Create new user
export const createUser = (name: string, teamId: string): User => {
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
      dailyEnergy: {}
    },
    achievements: []
  };
  
  localStorage.setItem(USER_KEY, JSON.stringify(newUser));
  return newUser;
};

// Save user data
export const saveUser = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
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
  const updatedTeams = teams.map(team => {
    if (team.id === teamId) {
      return { ...team, score: team.score + pointsToAdd };
    }
    return team;
  });
  
  localStorage.setItem(TEAMS_KEY, JSON.stringify(updatedTeams));
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

// Get list of available achievements
export const getAvailableAchievements = (): Achievement[] => {
  return achievementsData as Achievement[];
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
  
  if (existingIndex >= 0) {
    // Achievement exists, update progress
    const achievement = { ...user.achievements[existingIndex] };
    
    // Only update progress if it's not already unlocked
    if (!achievement.unlockedAt && achievement.progress !== undefined && achievement.maxProgress !== undefined) {
      achievement.progress = Math.min((achievement.progress || 0) + incrementProgress, achievement.maxProgress);
      
      // Check if achievement should be unlocked
      if (forceUnlock || achievement.progress >= achievement.maxProgress) {
        achievement.unlockedAt = new Date().toISOString();
      }
      
      // Update the user's achievements
      const updatedAchievements = [...user.achievements];
      updatedAchievements[existingIndex] = achievement;
      
      const updatedUser = { ...user, achievements: updatedAchievements };
      saveUser(updatedUser);
      
      return achievement;
    }
    
    return user.achievements[existingIndex];
  } else {
    // Achievement doesn't exist for user, add it
    const newAchievement = { ...achievementTemplate };
    
    // If it has progress, update it
    if (incrementProgress > 0 && newAchievement.progress !== undefined) {
      newAchievement.progress = incrementProgress;
      
      // Check if it should be unlocked immediately
      if (forceUnlock || (newAchievement.progress >= (newAchievement.maxProgress || 0))) {
        newAchievement.unlockedAt = new Date().toISOString();
      }
    } else if (forceUnlock) {
      newAchievement.unlockedAt = new Date().toISOString();
    }
    
    // Add to user's achievements
    const updatedUser = { 
      ...user, 
      achievements: [...user.achievements, newAchievement] 
    };
    
    saveUser(updatedUser);
    return newAchievement;
  }
};

// Update user stats with new prompt information
export const updateUserStats = (
  energyUsage: number,
  efficiency: 'high' | 'medium' | 'low'
): void => {
  const user = getUser();
  if (!user) return;
  
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