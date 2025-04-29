import { useState, useEffect } from 'react';
import { Team } from '../types';
import { getTeams, updateTeamScore } from '../utils/localStorage';

export const useTeams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load teams on initial render
  useEffect(() => {
    const loadTeams = () => {
      const loadedTeams = getTeams();
      setTeams(loadedTeams);
      setIsLoading(false);
    };
    
    loadTeams();
    
    // Set up refresh interval (every 5 minutes)
    const intervalId = setInterval(loadTeams, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Add points to a team
  const addTeamPoints = (teamId: string, points: number) => {
    updateTeamScore(teamId, points);
    
    // Update local state
    setTeams(prevTeams => 
      prevTeams.map(team => 
        team.id === teamId 
          ? { ...team, score: team.score + points } 
          : team
      )
    );
  };
  
  // Get a specific team by ID
  const getTeamById = (teamId: string): Team | undefined => {
    return teams.find(team => team.id === teamId);
  };
  
  // Get sorted teams (by score, descending)
  const getSortedTeams = (): Team[] => {
    return [...teams].sort((a, b) => b.score - a.score);
  };
  
  return {
    teams,
    isLoading,
    addTeamPoints,
    getTeamById,
    getSortedTeams
  };
};