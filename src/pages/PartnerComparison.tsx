import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Dumbbell, TrendingUp, Target, Award, Calendar, Star } from 'lucide-react';
import { WeeklyProgress } from '../components/partners/WeeklyProgress';
import { ActivityTracker } from '../components/partners/ActivityTracker';
import { getPartnerStats, toggleFavoritePartner } from '../services/partners';
import { getWorkoutStats } from '../services/workouts';

interface PartnerStats {
  name: string;
  username: string;
  weeklyWorkouts: number;
  totalWeight: number;
  completionRate: number;
  streak: number;
  isFavorite: boolean;
}

export function FitFamComparison() {
  const { partnerId } = useParams();
  const [partnerData, setPartnerData] = useState<PartnerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weeklyData, setWeeklyData] = useState<{
    userData: number[];
    partnerData: number[];
  }>({ userData: [0, 0, 0, 0], partnerData: [0, 0, 0, 0] });
  
  useEffect(() => {
    const loadData = async () => {
      if (!partnerId) return;

      try {
        setIsLoading(true);
        setError(null);
        
        const partnerStats = await getPartnerStats(partnerId);
        
        setPartnerData(partnerStats);
        setWeeklyData({
          userData: [0, 0, 0, 0],
          partnerData: partnerStats.weeklyProgress
        });
      } catch (err) {
        console.error('Partner data error:', err);
        setError('No workout data available for this week');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [partnerId]);

  const handleToggleFavorite = async () => {
    if (!partnerId || !partnerData) return;
    
    try {
      setIsTogglingFavorite(true);
      await toggleFavoritePartner(partnerId, !partnerData.isFavorite);
      setPartnerData(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update favorite status');
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-400">Loading comparison data...</div>
        </div>
      </div>
    );
  }

  if (error || !partnerData) {
    return (
      <div className="min-h-screen bg-black pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-red-400">
            {error || 'Failed to load partner data. Please try again.'}
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    { 
      icon: <Dumbbell className="w-6 h-6 text-blue-500" />,
      label: 'Weekly Workouts',
      value: partnerData.weeklyWorkouts || 'No workouts'
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-green-400" />,
      label: 'Total Weight (lbs)',
      value: partnerData.totalWeight ? `${partnerData.totalWeight} lbs` : 'No data'
    },
    {
      icon: <Target className="w-6 h-6 text-orange-400" />,
      label: 'Completion Rate',
      value: partnerData.completionRate ? `${partnerData.completionRate}%` : 'No data'
    },
    {
      icon: <Award className="w-6 h-6 text-purple-400" />,
      label: 'Current Streak',
      value: partnerData.streak || 'No streak'
    }
  ];

  return (
    <div className="min-h-screen bg-black pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center space-x-4 mb-8">
          <Link 
            to="/partners"
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to FitFam</span>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Progress with your FitFam: {partnerData.name}</h1>
            <p className="text-gray-400">Compare your workout progress and stay motivated together</p>
          </div>
          <button
            onClick={handleToggleFavorite}
            disabled={isTogglingFavorite}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              partnerData.isFavorite
                ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
            }`}
          >
            <Star className={`w-5 h-5 ${partnerData.isFavorite ? 'fill-current' : ''}`} />
            <span>{partnerData.isFavorite ? 'Favorited' : 'Add to Favorites'}</span>
          </button>
        </div>

        <div className="mb-12">
          <ActivityTracker partnerId={partnerId || ''} partnerName={partnerData.name} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <div key={index} className="p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/10">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-white/5 rounded-lg">
                  {stat.icon}
                </div>
                <h3 className="text-lg font-medium text-white">{stat.label}</h3>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/10">
            <h2 className="text-xl font-semibold text-white mb-6">Weekly Progress</h2>
            {weeklyData.partnerData.some(v => v > 0) ? (
              <WeeklyProgress 
                userData={weeklyData.userData}
                partnerData={weeklyData.partnerData}
              />
            ) : (
              <p className="text-center text-gray-400">
                No workout data available for this week yet. Start working out to see your progress!
              </p>
            )}
          </div>

          <div className="p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/10">
            <h2 className="text-xl font-semibold text-white mb-6">Recent Exercise Comparisons</h2>
            <div className="space-y-4">
              <p className="text-center text-gray-400">
                {partnerData.weeklyWorkouts === 0 && partnerData.userWorkouts === 0 
                  ? "No workouts completed yet. Start exercising together to see comparisons!"
                  : "Exercise comparison history will be available soon"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}