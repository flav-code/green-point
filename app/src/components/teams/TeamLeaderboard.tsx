import React, { useEffect, useState } from 'react';
import { Trophy, Users } from 'lucide-react';
import { useTeams } from '../../hooks/useTeams';
import { useUser } from '../../hooks/useUser';
import CardContainer from '../layout/CardContainer';

const TeamLeaderboard: React.FC = () => {
  const { teams } = useTeams();
  const { user } = useUser();

  if (!teams.length) {
    return (
      <CardContainer title="Team Leaderboard" icon={<Trophy className="w-5 h-5 text-yellow-500" />}>
        <div className="h-[200px] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </CardContainer>
    );
  }

  return (
    <CardContainer title="Team Leaderboard" icon={<Trophy className="w-5 h-5 text-yellow-500" />}>
      <div className="space-y-3">
        {teams.map((team, index) => {
          const isUserTeam = user?.teamId === team.id;

          return (
            <div 
              key={team.id} 
              className={`flex items-center p-2 rounded-md ${
                isUserTeam ? 'bg-primary-900/30 border border-primary-800' : 'hover:bg-background-darker'
              }`}
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-background-darker font-bold text-sm mr-3">
                {index + 1}
              </div>
              
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: team.color }}
              ></div>
              
              <div className="flex-1">
                <div className="flex items-center">
                  <span className={`font-medium ${isUserTeam ? 'text-primary-300' : ''}`}>{team.name}</span>
                  {isUserTeam && (
                    <span className="ml-2 text-xs bg-primary-900 text-primary-300 px-1.5 py-0.5 rounded">
                      Your Team
                    </span>
                  )}
                </div>
                
                <div className="w-full bg-background-darker rounded-full h-1.5 mt-1.5">
                  <div 
                    className="h-1.5 rounded-full" 
                    style={{ 
                      width: `${Math.min(100, (team.score / 2000) * 100)}%`,
                      backgroundColor: team.color 
                    }}
                  ></div>
                </div>
              </div>
              
              <div className="ml-3 text-right">
                <div className="font-semibold">{team.score}</div>
                <div className="text-xs text-gray-500 flex items-center justify-end">
                  <Users className="w-3 h-3 mr-1" />
                  {team.memberCount}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-3 text-xs text-center text-gray-500">
        <span>Leaderboard updates every 5 minutes</span>
      </div>
    </CardContainer>
  );
};

export default TeamLeaderboard;