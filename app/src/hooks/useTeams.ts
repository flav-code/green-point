import { useState, useEffect, useCallback } from 'react';
import { Team } from '../types';
import { getTeams, updateTeamScore as updateTeamScoreLocal } from '../utils/localStorage';

export const useTeams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch teams from API
  const fetchTeams = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("Fetching teams from API...");
      const res = await fetch('http://127.0.0.1:4000/teams');

      if (!res.ok) {
        throw new Error(`Failed to fetch teams: ${res.statusText}`);
      }

      const data = await res.json();
      console.log("Teams fetched successfully:", data);
      setTeams(data);
      return data;
    } catch (error) {
      console.error("Error fetching teams:", error);
      // Fallback to local storage if API fails
      const localTeams = getTeams();
      setTeams(localTeams);
      return localTeams;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load teams initially
  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Listen for team score updates
  useEffect(() => {
    const handleTeamScoreUpdate = async (event: Event) => {
      console.log("Team score update detected, refreshing teams");
      await fetchTeams();
    };

    window.addEventListener('team-score-updated', handleTeamScoreUpdate);

    return () => {
      window.removeEventListener('team-score-updated', handleTeamScoreUpdate);
    };
  }, [fetchTeams]);

  // Set up periodic refresh
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchTeams().catch(console.error);
    }, 60000); // Refresh every minute

    return () => clearInterval(intervalId);
  }, [fetchTeams]);

  // Add points to a team
  const addTeamPoints = useCallback(async (teamId: string, points: number) => {
    try {
      console.log(`Adding ${points} points to team ${teamId}`);
      // Update via API
      const res = await fetch('http://127.0.0.1:4000/team/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: teamId, score: points })
      });

      if (!res.ok) {
        throw new Error(`Failed to update team score: ${res.statusText}`);
      }

      // Also update local cache
      updateTeamScoreLocal(teamId, points);

      // Refresh teams after update
      await fetchTeams();
    } catch (error) {
      console.error("Error updating team points:", error);
      // Fallback to local update
      updateTeamScoreLocal(teamId, points);
      setTeams(getTeams());
    }
  }, [fetchTeams]);

  // Get a specific team by ID
  const getTeamById = useCallback((teamId: string): Team | undefined => {
    return teams.find(team => team.id === teamId);
  }, [teams]);

  // Get sorted teams (by score, descending)
  const getSortedTeams = useCallback(async (): Promise<Team[]> => {
    try {
      const fetchedTeams = await fetchTeams();
      return [...fetchedTeams].sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error("Error getting sorted teams:", error);
      return [...teams].sort((a, b) => b.score - a.score);
    }
  }, [fetchTeams, teams]);

  return {
    teams,
    isLoading,
    addTeamPoints,
    getTeamById,
    getSortedTeams,
    refreshTeams: fetchTeams
  };
};