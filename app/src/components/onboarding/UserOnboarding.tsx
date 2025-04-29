import React, { useState } from 'react';
import { User } from 'lucide-react';
import { useUser } from '../../hooks/useUser';
import { useTeams } from '../../hooks/useTeams';
import CardContainer from '../layout/CardContainer';

interface UserOnboardingProps {
  onComplete: () => void;
}

const UserOnboarding: React.FC<UserOnboardingProps> = ({ onComplete }) => {
  const { createNewUser } = useUser();
  const { teams, isLoading } = useTeams();
  const [name, setName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [step, setStep] = useState(1);
  
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length >= 2) {
      setStep(2);
    }
  };
  
  const handleTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTeam) {
      createNewUser(name, selectedTeam);
      onComplete();
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading teams...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-md mx-auto">
      <CardContainer 
        title="Welcome to GreenPoint" 
        icon={<User className="w-5 h-5 text-primary-400" />}
        className="border border-primary-800/50"
      >
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold mb-2">Join the Eco-Revolution</h3>
          <p className="text-gray-400">
            GreenPoint helps teams compete to be the most efficient AI users. Your individual 
            contributions will help your team rise to the top of the leaderboard!
          </p>
        </div>
        
        {step === 1 ? (
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">
                What should we call you?
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-md bg-background-darker border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter your name"
                minLength={2}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md transition-colors"
              disabled={name.trim().length < 2}
            >
              Continue
            </button>
          </form>
        ) : (
          <form onSubmit={handleTeamSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">
                Choose your team:
              </label>
              <div className="grid grid-cols-1 gap-3">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className={`border rounded-md p-3 cursor-pointer transition-all ${
                      selectedTeam === team.id
                        ? `border-2 border-${team.color} bg-background-darker/80`
                        : 'border-gray-700 hover:border-gray-500'
                    }`}
                    onClick={() => setSelectedTeam(team.id)}
                  >
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-3" 
                        style={{ backgroundColor: team.color }}
                      ></div>
                      <span className="font-medium">{team.name}</span>
                      <span className="ml-auto text-sm text-gray-500">
                        {team.memberCount} members
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-md transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md transition-colors"
                disabled={!selectedTeam}
              >
                Join Team
              </button>
            </div>
          </form>
        )}
      </CardContainer>
    </div>
  );
};

export default UserOnboarding;