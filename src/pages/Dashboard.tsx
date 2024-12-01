import React, { useState, useEffect } from 'react';
import { WorkoutList } from '../components/workouts/WorkoutList';
import { Activity, TrendingUp, Users } from 'lucide-react';
import { getDashboardStats } from '../services/dashboard';

interface DashboardProps {
  onWorkoutChange?: () => void;
}

export function Dashboard() {
  const [stats, setStats] = useState<{
    totalWorkouts: number;
    completedWorkouts: number;
    progress: number;
    partners: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard stats');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const dashboardStats = [
    { 
      icon: <Activity className="w-6 h-6 text-blue-500" />, 
      label: 'Workouts', 
      value: stats ? `${stats.completedWorkouts}/${stats.totalWorkouts}` : '-'
    },
    { 
      icon: <TrendingUp className="w-6 h-6 text-green-400" />, 
      label: 'Progress', 
      value: stats ? `${stats.progress}%` : '-'
    },
    { 
      icon: <Users className="w-6 h-6 text-orange-400" />, 
      label: 'Partners', 
      value: stats?.partners.toString() || '-'
    },
  ];

  return (
    <div className="min-h-screen bg-black pt-16">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>
        
        {error && (
          <div className="text-red-400 text-center mb-6">{error}</div>
        )}

        {isLoading ? (
          <div className="text-center text-gray-400 mb-8">Loading dashboard stats...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {dashboardStats.map((stat, index) => (
              <div key={index} className="p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">{stat.label}</p>
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                  {stat.icon}
                </div>
              </div>
            ))}
          </div>
        )}

        <WorkoutList onWorkoutChange={loadStats} />
      </div>
    </div>
  );
}