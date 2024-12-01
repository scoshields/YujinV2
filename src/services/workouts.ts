import { supabase } from '../lib/supabase';
import type { WorkoutExercise, WorkoutStats } from '../types/workout';

export async function getWorkoutStats(): Promise<WorkoutStats> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setHours(0, 0, 0, 0);

  // Get all workouts for the current week
  const { data: workouts, error: workoutsError } = await supabase
    .from('daily_workouts')
    .select(`
      id,
      title,
      duration,
      difficulty,
      date,
      completed,
      is_favorite,
      is_shared,
      shared_with,
      workout_exercises (
        id,
        name,
        target_sets,
        target_reps,
        notes,
        exercise_sets (
          id,
          user_id,
          set_number,
          weight,
          reps,
          completed
        )
      )
    `)
    .eq('user_id', user.id)
    .gte('date', startOfWeek.toISOString());

  if (workoutsError && workoutsError.code !== 'PGRST116') throw workoutsError;

  const totalWorkouts = workouts?.length || 0;
  const completedWorkouts = workouts?.filter(w => w.completed).length || 0;

  const exerciseCompletion = workouts?.reduce((acc, workout) => {
    const totalSets = workout.exercises?.reduce((sets, ex) => 
      sets + (ex.exercise_sets?.length || 0), 0) || 0;
    const completedSets = workout.exercises?.reduce((sets, ex) => 
      sets + (ex.exercise_sets?.filter(set => set.completed)?.length || 0), 0) || 0;
    return {
      total: acc.total + totalSets,
      completed: acc.completed + completedSets
    };
  }, { total: 0, completed: 0 });

  // Get partner's stats from yesterday
  // Get partner data
  const { data: partnerRelation, error: partnerError } = await supabase
    .from('workout_partners')
    .select('partner_id')
    .eq('user_id', user.id)
    .eq('status', 'accepted')
    .single();

  if (partnerError && partnerError.code !== 'PGRST116') throw partnerError;

  let partnerStats = null;
  if (partnerRelation?.partner_id) {
    const { data: partnerData, error: partnerError } = await supabase
      .from('daily_workouts')
      .select(`
        id,
        completed,
        date,
        exercises:workout_exercises (
          id,
          exercise_sets (
            completed
          )
        ),
        user:user_id (
          name
        )
      `)
      .eq('user_id', partnerRelation.partner_id)
      .gte('date', startOfWeek.toISOString());

    if (partnerError && partnerError.code !== 'PGRST116') throw partnerError;

    if (partnerData) {
      const partnerCompletedWorkouts = partnerData.filter(w => w.completed).length;
      const partnerTotalSets = partnerData.reduce((total, workout) => 
        total + (workout.exercises?.reduce((sets, ex) => 
          sets + (ex.exercise_sets?.length || 0), 0) || 0), 0);
      const partnerCompletedSets = partnerData.reduce((total, workout) => 
        total + (workout.exercises?.reduce((sets, ex) => 
          sets + (ex.exercise_sets?.filter(set => set.completed)?.length || 0), 0) || 0), 0);

      partnerStats = {
        name: partnerData[0]?.user?.name || 'Partner',
        completedWorkouts: partnerCompletedWorkouts,
        completionRate: Math.round((partnerCompletedSets / (partnerTotalSets || 1)) * 100)
      };
    }
  }

  const stats: WorkoutStats = {
    weeklyWorkouts: totalWorkouts,
    completedWorkouts,
    completionRate: Math.round((completedWorkouts / (totalWorkouts || 1)) * 100),
    exerciseCompletion: {
      total: exerciseCompletion?.total || 0,
      completed: exerciseCompletion?.completed || 0,
      rate: Math.round((exerciseCompletion?.completed || 0) / (exerciseCompletion?.total || 1) * 100)
    },
    partner: partnerStats
  };

  return stats;
}

export async function deleteWorkout(workoutId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Delete the workout (cascade will handle related records)
  const { error } = await supabase
    .from('daily_workouts')
    .delete()
    .eq('id', workoutId)
    .eq('user_id', user.id);

  if (error) throw error;
}

export async function deleteExercise(exerciseId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Verify ownership before deleting
  const { data: exercise, error: verifyError } = await supabase
    .from('workout_exercises')
    .select('daily_workout_id')
    .eq('id', exerciseId)
    .single();

  if (verifyError) throw verifyError;
  if (!exercise) throw new Error('Exercise not found');

  const { data: workout, error: workoutError } = await supabase
    .from('daily_workouts')
    .select('user_id')
    .eq('id', exercise.daily_workout_id)
    .single();

  if (workoutError) throw workoutError;
  if (!workout) throw new Error('Workout not found');
  if (workout.user_id !== user.id) throw new Error('Not authorized to delete this exercise');

  // Delete the exercise (cascade will handle exercise sets)
  const { error } = await supabase
    .from('workout_exercises')
    .delete()
    .eq('id', exerciseId);

  if (error) throw error;
}

export async function getCurrentWeekWorkouts() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const { data: workouts, error: workoutsError } = await supabase
    .from('daily_workouts')
    .select(`
      id,
      title,
      duration,
      difficulty,
      date,
      completed,
      is_favorite,
      is_shared,
      shared_with,
      workout_exercises (
        id,
        name,
        target_sets,
        target_reps,
        notes,
        exercise_sets (
          id,
          user_id,
          set_number,
          weight,
          reps,
          completed
        )
      )
    `)
    .eq('user_id', user.id)
    .gte('date', startOfWeek.toISOString())
    .order('date', { ascending: true });

  if (workoutsError) throw workoutsError;
  
  // Process workouts to ensure each exercise has the correct number of sets
  const processedWorkouts = workouts?.map(workout => {
    const exercises = workout.workout_exercises || [];
    workout.exercises = exercises.map(exercise => {
      // Filter sets for current user and sort by set number
      const userSets = (exercise.exercise_sets || [])
        .filter(set => set.user_id === user.id)
        .sort((a, b) => a.set_number - b.set_number);
      
      // Create missing sets if needed
      if (userSets.length < exercise.target_sets) {
        const missingSetCount = exercise.target_sets - userSets.length;
        const newSets = Array.from({ length: missingSetCount }, (_, i) => ({
          exercise_id: exercise.id,
          user_id: user.id,
          set_number: userSets.length + i + 1,
          weight: 0,
          reps: 0,
          completed: false
        }));

        // Insert missing sets
        supabase
          .from('exercise_sets')
          .insert(newSets)
          .then(({ error }) => {
            if (error) console.error('Failed to create sets:', error);
          });

        // Add new sets to the response
        userSets.push(...newSets);
      }
      
      exercise.exercise_sets = userSets;
      return exercise;
    });
    
    delete workout.workout_exercises;
    return workout;
  }) || [];

  return processedWorkouts;
}

export async function getFavoriteWorkouts() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('daily_workouts')
    .select(`
      id,
      title,
      duration,
      difficulty,
      date,
      completed,
      is_favorite,
      is_shared,
      shared_with,
      workout_exercises (
        id,
        name,
        target_sets,
        target_reps,
        exercise_sets!left (
          id,
          user_id,
          set_number,
          weight,
          reps,
          completed
        )
      ),
      user_id
    `)
    .eq('user_id', user.id)
    .eq('is_favorite', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function toggleFavorite(workoutId: string, isFavorite: boolean) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('daily_workouts')
    .update({ is_favorite: isFavorite })
    .eq('id', workoutId)
    .eq('user_id', user.id);

  if (error) throw error;
}

export async function addWorkoutToWeek(workoutId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get the workout template
  const { data: template, error: templateError } = await supabase
    .from('daily_workouts')
    .select(`
      id,
      title,
      duration,
      difficulty,
      date,
      completed,
      is_favorite,
      is_shared,
      shared_with,
      exercises:workout_exercises (
        name,
        target_sets,
        target_reps,
        notes
      )
    `)
    .eq('id', workoutId)
    .single();

  if (templateError) throw templateError;
  if (!template) throw new Error('Workout not found');

  // Create new workout from template
  const { data: newWorkout, error: workoutError } = await supabase
    .from('daily_workouts')
    .insert({
      user_id: user.id,
      title: template.title,
      duration: template.duration,
      difficulty: template.difficulty,
      date: new Date().toISOString(),
      is_shared: false,
      shared_with: [],
      completed: false,
      is_favorite: false
    })
    .select()
    .single();

  if (workoutError) throw workoutError;

  // Create exercises
  for (const exercise of template.exercises) {
    const { data: newExercise, error: exerciseError } = await supabase
      .from('workout_exercises')
      .insert({
        daily_workout_id: newWorkout.id,
        name: exercise.name,
        target_sets: exercise.target_sets,
        target_reps: exercise.target_reps,
        notes: exercise.notes
      })
      .select()
      .single();

    if (exerciseError) throw exerciseError;

    // Create exercise sets
    const exerciseSets = Array.from(
      { length: exercise.target_sets },
      (_, i) => ({
        exercise_id: newExercise.id,
        user_id: user.id,
        set_number: i + 1,
        weight: 0,
        reps: 0,
        completed: false
      })
    );

    const { error: setsError } = await supabase
      .from('exercise_sets')
      .insert(exerciseSets);

    if (setsError) throw setsError;
  }

  return newWorkout;
}

export async function generateWorkout(
  workoutType: string,
  difficulty: 'easy' | 'medium' | 'hard',
  exercises: WorkoutExercise[],
  sharing?: {
    isShared: boolean;
    sharedWith?: string[];
  }
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Create workout title from selected body parts
  const bodyPartsTitle = exercises
    .map(ex => ex.bodyPart)
    .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
    .join('/');
  
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { 
    month: 'numeric',
    day: 'numeric',
    year: '2-digit'
  });

  // Define ranges based on workout type
  const ranges = workoutType === 'strength' 
    ? { sets: { min: 3, max: 5 }, reps: { min: 6, max: 12 } }
    : { sets: { min: 2, max: 3 }, reps: { min: 12, max: 15 } };

  // Get exercises for all selected body parts
  const selectedExercises = [];
  
  for (const exercise of exercises) {
    const { data: availableExercises, error: exercisesError } = await supabase
      .from('available_exercises')
      .select('*')
      .eq('main_muscle_group', exercise.bodyPart);

    if (exercisesError) throw exercisesError;
    if (!availableExercises?.length) {
      throw new Error(`No exercises found for ${exercise.bodyPart}`);
    }

    // Randomly select exercises for this body part
    const exercisesForBodyPart = availableExercises
      .sort(() => 0.5 - Math.random())
      .slice(0, 2) // Select 2 exercises per body part
      .map(ex => ({
        name: ex.name,
        targetSets: Math.floor(Math.random() * (ranges.sets.max - ranges.sets.min + 1)) + ranges.sets.min,
        targetReps: `${ranges.reps.min}-${ranges.reps.max}`,
        bodyPart: ex.main_muscle_group,
        notes: `Equipment: ${ex.primary_equipment}, Grip: ${ex.grip_style || 'Any'}`
      }));

    selectedExercises.push(...exercisesForBodyPart);
  }

  // Create daily workout
  const { data: dailyWorkout, error: dayError } = await supabase
    .from('daily_workouts')
    .insert({
      user_id: user.id,
      date: new Date().toISOString(),
      title: `${bodyPartsTitle} (${formattedDate})`,
      workout_type: workoutType,
      difficulty: difficulty,
      duration: 1, // Initial duration, will be updated by trigger
      is_shared: sharing?.isShared ?? false,
      shared_with: sharing?.sharedWith || [],
      completed: false,
      is_favorite: false
    })
    .select()
    .single();

  if (dayError) throw dayError;
  if (!dailyWorkout) throw new Error('Failed to create workout');

  // Insert exercises and their sets
  for (const exercise of selectedExercises) {
    // Insert exercise
    const { data: exerciseData, error: exerciseError } = await supabase
      .from('workout_exercises')
      .insert({
        daily_workout_id: dailyWorkout.id,
        name: exercise.name,
        target_sets: exercise.targetSets,
        target_reps: exercise.targetReps,
        notes: exercise.notes || ''
      })
      .select()
      .single();

    if (exerciseError) throw exerciseError;
    if (!exerciseData) throw new Error('Failed to create exercise');

    // Create exercise sets
    const exerciseSets = Array.from(
      { length: exercise.targetSets },
      (_, i) => ({
        exercise_id: exerciseData.id,
        user_id: user.id,
        set_number: i + 1,
        weight: 0,
        reps: 0,
        completed: false
      })
    );

    // Insert exercise sets
    const { error: setsError } = await supabase
      .from('exercise_sets')
      .insert(exerciseSets);

    if (setsError) throw setsError;
  }

  return dailyWorkout;
}