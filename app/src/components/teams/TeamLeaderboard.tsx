import React, { useEffect, useState } from 'react';
import { Trophy, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { useTeams } from '../../hooks/useTeams';
import { useUser } from '../../hooks/useUser';
import CardContainer from '../layout/CardContainer';
import { Team } from '../../types';

// Define an interface for the team score update event detail
interface TeamScoreUpdateDetail {
    teamId: string;
    pointChange: number;
    newScore: number;
}

const TeamLeaderboard: React.FC = () => {
    const { teams, getSortedTeams } = useTeams();
    const { user } = useUser();
    const [displayTeams, setDisplayTeams] = useState<Team[]>([]);
    const [scoreUpdates, setScoreUpdates] = useState<Record<string, { value: number, timestamp: number }>>({});

    // Load teams on component mount
    useEffect(() => {
        setDisplayTeams(teams);
    }, [teams]);

    // Listen for team score updates
    useEffect(() => {
        const handleTeamScoreUpdate = async (event: Event) => {
            // Properly cast the event to CustomEvent with our specific detail type
            const customEvent = event as CustomEvent<TeamScoreUpdateDetail>;
            const { teamId, pointChange } = customEvent.detail;

            // Refresh teams data
            const updatedTeams = await getSortedTeams();
            setDisplayTeams(updatedTeams);

            // Set score update notification
            setScoreUpdates(prev => ({
                ...prev,
                [teamId]: {
                    value: pointChange,
                    timestamp: Date.now()
                }
            }));

            // Clear notification after 3 seconds
            setTimeout(() => {
                setScoreUpdates(prev => {
                    const newUpdates = { ...prev };
                    delete newUpdates[teamId];
                    return newUpdates;
                });
            }, 3000);
        };

        // Add event listener for team score updates - no type casting needed now
        window.addEventListener('team-score-updated', handleTeamScoreUpdate);

        return () => {
            window.removeEventListener('team-score-updated', handleTeamScoreUpdate);
        };
    }, [getSortedTeams]);

    // Score update notification component
    const ScoreUpdateIndicator = ({ value }: { value: number }) => {
        if (value === 0) return null;

        if (value > 0) {
            return (
                <div className="flex items-center text-green-400 animate-pulse">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    <span>+{value}</span>
                </div>
            );
        } else {
            return (
                <div className="flex items-center text-red-400 animate-pulse">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    <span>{value}</span>
                </div>
            );
        }
    };

    if (!displayTeams.length) {
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
                {displayTeams.map((team, index) => {
                    const isUserTeam = user?.teamId === team.id;
                    const hasScoreUpdate = team.id in scoreUpdates;

                    return (
                        <div
                            key={team.id}
                            className={`flex items-center p-2 rounded-md ${
                                isUserTeam ? 'bg-primary-900/30 border border-primary-800' : 'hover:bg-background-darker'
                            } ${hasScoreUpdate ? 'transition-colors duration-500' : ''}`}
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
                                        className="h-1.5 rounded-full transition-all duration-700"
                                        style={{
                                            width: `${Math.min(100, (team.score / 2000) * 100)}%`,
                                            backgroundColor: team.color
                                        }}
                                    ></div>
                                </div>
                            </div>

                            <div className="ml-3 text-right">
                                <div className="font-semibold flex items-center justify-end">
                                    {team.score}
                                    {hasScoreUpdate && (
                                        <span className="ml-2">
                                            <ScoreUpdateIndicator value={scoreUpdates[team.id].value} />
                                        </span>
                                    )}
                                </div>
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
                <span>Leaderboard updates in real-time</span>
            </div>
        </CardContainer>
    );
};

export default TeamLeaderboard;