import React, { useState, useEffect } from 'react';
import { WorkoutCard } from './WorkoutCard';
import { getCurrentWeekWorkouts } from '../../services/workouts';

interface WorkoutListProps {
  onWorkoutChange?: () => void;
}

export function WorkoutList({ onWorkoutChange }: WorkoutListProps) {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkouts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getCurrentWeekWorkouts();
      
      // Filter for today's workouts
      const today = new Date().toISOString().split('T')[0];
      const todaysWorkouts = data?.filter(workout => 
        workout.date.startsWith(today)
      ) || [];
      
      setWorkouts(todaysWorkouts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workouts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkouts();
  }, []);

  if (isLoading) {
    return <div className="text-center text-gray-400">Loading workouts...</div>;
  }

  if (error) {
    return <div className="text-center text-red-400">{error}</div>;
  }

  if (workouts.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {workouts.map((workout) => (
        <WorkoutCard
          key={workout.id}
          id={workout.id}
          title={workout.title}
          duration={`${workout.duration} min`}
          difficulty={workout.difficulty}
          exercises={workout.exercises?.map((ex: any) => ({
            name: ex.name,
            target_sets: ex.target_sets,
            target_reps: ex.target_reps,
            exercise_sets: ex.exercise_sets
          }))}
          onDelete={() => {
            loadWorkouts();
            onWorkoutChange?.();
          }}
        />
      ))}
    </div>
  );
}