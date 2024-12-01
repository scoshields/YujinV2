import { supabase } from '../lib/supabase';

export async function getDashboardStats() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get total workouts
  const { data: workouts, error: workoutsError } = await supabase
    .from('daily_workouts')
    .select('id, completed')
    .eq('user_id', user.id);

  if (workoutsError) throw workoutsError;

  // Get partner count
  const { data: partners, error: partnersError } = await supabase
    .from('workout_partners')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'accepted');

  if (partnersError) throw partnersError;

  // Calculate progress
  const totalWorkouts = workouts?.length || 0;
  const completedWorkouts = workouts?.filter(w => w.completed).length || 0;
  const progressPercentage = totalWorkouts > 0 
    ? Math.round((completedWorkouts / totalWorkouts) * 100)
    : 0;

  return {
    totalWorkouts,
    completedWorkouts,
    progress: progressPercentage,
    partners: partners?.length || 0
  };
}