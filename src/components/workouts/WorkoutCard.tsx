import React, { useState } from 'react';
import { Dumbbell, Clock, Trophy, Trash2, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { deleteWorkout, toggleFavorite } from '../../services/workouts';

interface Exercise {
  name: string;
  target_sets: number;
  target_reps: string;
  equipment?: string;
  exercise_sets?: {
    completed: boolean;
  }[];
}

interface WorkoutCardProps {
  id: string;
  title: string;
  duration: string;
  difficulty: 'easy' | 'medium' | 'hard';
  exercises: Exercise[];
  is_favorite?: boolean;
  partnerName?: string;
  onDelete?: () => void;
}

export function WorkoutCard({ 
  id, 
  title, 
  duration, 
  difficulty, 
  exercises, 
  is_favorite,
  partnerName, 
  onDelete 
}: WorkoutCardProps) {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(is_favorite);

  const difficultyColors = {
    easy: 'text-green-400',
    medium: 'text-orange-400',
    hard: 'text-red-400'
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this workout?')) return;
    
    try {
      setIsDeleting(true);
      await deleteWorkout(id);
      onDelete?.();
    } catch (err) {
      console.error('Failed to delete workout:', err);
      alert('Failed to delete workout');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleFavorite(id, !isFavorite);
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      alert('Failed to update favorite status');
    }
  };

  return (
    <div className="p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/10 hover:border-blue-500/30 transition-colors"
      onClick={() => navigate(`/workouts/${id}`)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Dumbbell className="w-6 h-6 text-blue-500" />
          <h3 className="text-xl font-semibold text-white">{title}</h3>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-gray-400">{duration}</span>
          <button
            onClick={handleToggleFavorite}
            className={`p-1 transition-colors ${
              isFavorite ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-400 hover:text-yellow-400'
            }`}
          >
            <Star className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        {exercises?.slice(0, 3).map((exercise, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Trophy className={`w-4 h-4 ${
              exercise.exercise_sets?.every(set => set.completed)
                ? 'text-green-400'
                : difficultyColors[difficulty]
            }`} />
            <span className="text-gray-300 flex-1">
              {exercise.name}
              <span className="text-gray-500 text-sm ml-1">
                ({exercise.target_sets || 0}x{exercise.target_reps || '0'})
              </span>
            </span>
            {exercise.equipment && (
              <span className="text-gray-500 text-sm">
                {exercise.equipment}
              </span>
            )}
          </div>
        ))}
      </div>

      {partnerName && (
        <div className="mt-4 pt-4 border-t border-blue-500/10">
          <p className="text-sm text-gray-400">
            Partner: <span className="text-blue-400">{partnerName}</span>
          </p>
        </div>
      )}
    </div>
  );
}