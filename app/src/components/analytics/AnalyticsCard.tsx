import React, { useEffect, useState, useCallback } from 'react';
import { BarChart3, Activity } from 'lucide-react';
import { User } from '../../types';
import CardContainer from '../layout/CardContainer';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData
} from 'chart.js';
import { getUser } from '../../utils/localStorage';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface AnalyticsCardProps {
  user: User;
}

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({ user: initialUser }) => {
  const [user, setUser] = useState<User>(initialUser);
  const [chartData, setChartData] = useState<ChartData<'line'>>({
    labels: [],
    datasets: []
  });

  // Create a more robust function to get updated user data
  const getUpdatedUserData = useCallback(() => {
    const updatedUser = getUser();
    if (updatedUser) {
      return updatedUser;
    }
    return null;
  }, []);

  // Update chart data based on user stats
  const updateChartData = useCallback((userData: User) => {
    // Prepare daily data for the last 7 days
    const dates = [];
    const promptCounts = [];
    const energyData = [];

    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      dates.push(dateString.slice(5)); // Format as MM-DD
      promptCounts.push(userData.stats.dailyPrompts[dateString] || 0);
      energyData.push(userData.stats.dailyEnergy[dateString] || 0);
    }

    setChartData({
      labels: dates,
      datasets: [
        {
          label: 'Prompts',
          data: promptCounts,
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          tension: 0.3,
          yAxisID: 'y'
        },
        {
          label: 'Energy Usage',
          data: energyData,
          borderColor: '#4ade80',
          backgroundColor: 'rgba(74, 222, 128, 0.1)',
          tension: 0.3,
          yAxisID: 'y1'
        }
      ]
    });
  }, []);

  // Update both user and chart data
  const updateUserAndChartData = useCallback(() => {
    const updatedUser = getUpdatedUserData();
    if (updatedUser) {
      // Only update if the data has actually changed
      if (JSON.stringify(updatedUser.stats) !== JSON.stringify(user.stats)) {
        console.log("Analytics: Updating user data and chart");
        setUser(updatedUser);
        updateChartData(updatedUser);
      }
    }
  }, [user, getUpdatedUserData, updateChartData]);

  // Set up an interval to refresh user data
  useEffect(() => {
    // Initial update
    updateUserAndChartData();

    // Set up polling for updates
    const intervalId = setInterval(() => {
      updateUserAndChartData();
    }, 2000); // Check for updates every 2 seconds

    return () => clearInterval(intervalId);
  }, [updateUserAndChartData]);

  // Add event listener for updates
  useEffect(() => {
    const handleUserUpdate = () => {
      console.log("Analytics: User update event received");
      updateUserAndChartData();
    };

    // Listen for various update events
    window.addEventListener('user-data-updated', handleUserUpdate);
    window.addEventListener('user-stats-updated', handleUserUpdate);

    return () => {
      window.removeEventListener('user-data-updated', handleUserUpdate);
      window.removeEventListener('user-stats-updated', handleUserUpdate);
    };
  }, [updateUserAndChartData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Prompts',
          color: '#94a3b8'
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Energy',
          color: '#94a3b8'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
      x: {
        grid: {
          color: 'rgba(148, 163, 184, 0.1)'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#94a3b8'
        }
      },
    },
  };

  // Calculate efficiency percentage
  const efficiencyPercentage = user.stats.totalPrompts > 0
      ? Math.round((user.stats.efficientPrompts / user.stats.totalPrompts) * 100)
      : 0;

  return (
      <CardContainer title="Personal Analytics" icon={<BarChart3 className="w-5 h-5 text-secondary-400" />}>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-background-darker p-3 rounded-md">
            <div className="text-xs text-gray-500 mb-1">Total Prompts</div>
            <div className="text-xl font-semibold">{user.stats.totalPrompts}</div>
          </div>
          <div className="bg-background-darker p-3 rounded-md">
            <div className="text-xs text-gray-500 mb-1">Efficiency</div>
            <div className="text-xl font-semibold">
              {efficiencyPercentage}%
              <span className="ml-1 text-xs text-gray-500">efficient</span>
            </div>
          </div>
          <div className="bg-background-darker p-3 rounded-md">
            <div className="text-xs text-gray-500 mb-1">Avg Energy Usage</div>
            <div className="text-xl font-semibold">
              {user.stats.averageEnergy.toFixed(1)}
              <span className="ml-1 text-xs text-gray-500">units</span>
            </div>
          </div>
          <div className="bg-background-darker p-3 rounded-md">
            <div className="text-xs text-gray-500 mb-1">Member Since</div>
            <div className="text-xl font-semibold">
              {new Date(user.joinDate).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center mb-2">
            <Activity className="w-4 h-4 text-secondary-400 mr-2" />
            <h3 className="text-sm font-medium">Weekly Activity</h3>
          </div>
          <div className="bg-background-darker p-3 rounded-md" style={{ height: "180px" }}>
            <Line options={chartOptions} data={chartData} />
          </div>
        </div>
      </CardContainer>
  );
};

export default AnalyticsCard;