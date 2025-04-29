import { useState, useEffect } from 'react';
import { Team } from '../types';

export const useTeams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load teams from API on initial render
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const res = await fetch('http://127.0.0.1:4000/teams');
        const data = await res.json();
        setTeams(data);
      } catch (e) {
        setTeams([]);
      }
      setIsLoading(false);
    };

    loadTeams();
    // Set up refresh interval (every 5 minutes)
    const intervalId = setInterval(loadTeams, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Add points to a team
  const addTeamPoints = async (teamId: string, points: number) => {
    await fetch('http://127.0.0.1:4000/team/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: teamId, score: points })
    });
    // Refresh teams after update
    const res = await fetch('http://127.0.0.1:4000/teams');
    const data = await res.json();
    setTeams(data);
  };

  // Get a specific team by ID
  const getTeamById = (teamId: string): Team | undefined => {
    return teams.find(team => team.id === teamId);
  };

  // Get sorted teams (by score, descending) from API
  const getSortedTeams = async (): Promise<Team[]> => {
    const res = await fetch('http://127.0.0.1:4000/teams');
    const data = await res.json();
    return data.sort((a: Team, b: Team) => b.score - a.score);
  };

  return {
    teams,
    isLoading,
    addTeamPoints,
    getTeamById,
    getSortedTeams
  };
};