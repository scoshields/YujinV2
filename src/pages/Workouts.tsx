import React, { useState, useEffect, useMemo } from 'react';
import { Dumbbell, Clock, Target, Users, Star, Plus } from 'lucide-react';
import { WorkoutCard } from '../components/workouts/WorkoutCard';
import { WorkoutGenerator } from '../components/workouts/WorkoutGenerator';
import { getWorkoutStats, getCurrentWeekWorkouts, getFavoriteWorkouts, addWorkoutToWeek } from '../services/workouts';
import type { WorkoutStats } from '../types/workout';

export function Workouts() {
  const [showGenerator, setShowGenerator] = useState(false);
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [favoriteWorkouts, setFavoriteWorkouts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [statsData, workoutData, favoritesData] = await Promise.all([
        getWorkoutStats(),
        getCurrentWeekWorkouts(),
        getFavoriteWorkouts()
      ]);
      setStats(statsData);
      setWorkouts(workoutData || []);
      setFavoriteWorkouts(favoritesData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const workoutCards = useMemo(() => {
    if (!workouts) return [];
    
    return workouts.map((workout) => ({
      id: workout.id,
      title: workout.title,
      duration: `${workout.duration} min`,
      difficulty: workout.difficulty,
      exercises: workout.exercises?.map(ex => ({
        name: ex.name,
        target_sets: ex.target_sets,
        target_reps: ex.target_reps
      })) || [],
      date: new Date(workout.date).toLocaleDateString()
    }));
  }, [workouts]);

  const handleAddToWeek = async (workoutId: string) => {
    try {
      await addWorkoutToWeek(workoutId);
      loadData(); // Refresh data
    } catch (err) {
      console.error('Failed to add workout:', err);
      alert('Failed to add workout to current week');
    }
  };

  return (
    <div className="min-h-screen bg-black pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Your Workouts</h1>
            <p className="text-gray-400">Track and generate your weekly workout plans</p>
          </div>
          <button
            onClick={() => setShowGenerator(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-green-400 rounded-lg hover:opacity-90 transition-opacity"
          >
            <Dumbbell className="w-5 h-5" />
            <span>Generate Workout</span>
          </button>
        </div>

        {error && (
          <div className="text-red-400 text-center mb-6">{error}</div>
        )}

        {isLoading ? (
          <div className="text-center text-gray-400 mb-8">Loading workout stats...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Weekly Progress</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {stats?.completedWorkouts}/{stats?.weeklyWorkouts}
                  </p>
                </div>
                <Clock className="w-6 h-6 text-blue-500" />
              </div>
            </div>

            <div className="p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Completion Rate</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats?.completionRate}%</p>
                </div>
                <Target className="w-6 h-6 text-green-400" />
              </div>
            </div>

            <div className="p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Exercise Sets</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {stats?.exerciseCompletion.completed}/{stats?.exerciseCompletion.total}
                  </p>
                </div>
                <Dumbbell className="w-6 h-6 text-orange-400" />
              </div>
            </div>

            {stats?.partner && (
              <div className="p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{stats.partner.name}'s Progress</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-2xl font-bold text-white">
                      {stats.partner.completionRate}%
                    </p>
                    <span className="text-sm text-gray-400">
                      ({stats.partner.completedWorkouts} workouts)
                    </span>
                  </div>
                </div>
                <Users className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            )}
        </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-center space-x-2 mb-6 col-span-3">
            <Dumbbell className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold text-white">This Week's Workouts</h2>
          </div>
          {workoutCards.map((workout, index) => (
            <WorkoutCard 
              key={index} 
              {...workout} 
              onDelete={loadData}
            />
          ))}
          {workoutCards.length === 0 && !isLoading && (
            <div className="col-span-3 text-center text-gray-400 py-8">
              No workouts found. Click &quot;Generate Workout&quot; to create one!
            </div>
          )}
        </div>

        {/* Favorites Section */}
        {favoriteWorkouts.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center space-x-2 mb-6">
              <Star className="w-5 h-5 text-yellow-400" />
              <h2 className="text-xl font-semibold text-white">Favorite Workouts</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteWorkouts.map((workout) => (
                <div key={workout.id} className="relative group">
                  <WorkoutCard
                    {...workout}
                    duration={`${workout.duration} min`}
                    exercises={workout.exercises?.map((ex: any) => ({
                      name: ex.name,
                      target_sets: ex.target_sets,
                      target_reps: ex.target_reps,
                      exercise_sets: ex.exercise_sets
                    }))}
                    onDelete={loadData}
                  />
                  <button
                    onClick={() => handleAddToWeek(workout.id)}
                    className="absolute bottom-4 right-4 p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors opacity-0 group-hover:opacity-100"
                    title="Add to current week"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {showGenerator && (
          <WorkoutGenerator onClose={() => {
            setShowGenerator(false);
            loadData();
          }} />
        )}
      </div>
    </div>
  );
}