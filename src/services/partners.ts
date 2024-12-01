import { supabase } from '../lib/supabase';

export async function searchUsers(query: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get current user's profile
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single();
  if (!userData) throw new Error('User profile not found');

  const { data, error } = await supabase
    .from('users')
    .select('id, name, username')
    .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
    .neq('id', userData.id)
    .limit(10);

  if (error) throw error;
  return data;
}

export async function sendPartnerInvite(partnerId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get current user's profile
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single();
  if (!userData) throw new Error('User profile not found');

  const { data, error } = await supabase
    .from('workout_partners')
    .insert({
      user_id: userData.id,
      partner_id: partnerId,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPartners() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get current user's profile
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id) 
    .single();
  if (!userData) throw new Error('User profile not found');

  // Get sent invites
  const { data: sentInvites, error: sentError } = await supabase
    .from('workout_partners')
    .select(`
      id,
      status,
      created_at,
      is_favorite,
      partner:users!workout_partners_partner_id_fkey (
        id,
        name,
        username
      )
    `)
    .eq('user_id', userData.id);

  if (sentError) throw sentError;

  // Get received invites
  const { data: receivedInvites, error: receivedError } = await supabase
    .from('workout_partners')
    .select(`
      id,
      status,
      created_at,
      is_favorite,
      user:users!workout_partners_user_id_fkey (
        id,
        name,
        username
      )
    `)
    .eq('partner_id', userData.id);

  if (receivedError) throw receivedError;

  return {
    sent: sentInvites || [],
    received: receivedInvites || []
  };
}

export async function respondToInvite(inviteId: string, status: 'accepted' | 'rejected') {
  const { error } = await supabase
    .from('workout_partners')
    .update({ status })
    .eq('id', inviteId);

  if (error) throw error;
}

export async function cancelInvite(inviteId: string) {
  const { error } = await supabase
    .from('workout_partners')
    .delete()
    .eq('id', inviteId);

  if (error) throw error;
}

export async function getPartnerStats(partnerId: string) {
  // Get partner's basic info and current week's workouts
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  // Get partner's basic info
  const { data: partnerData, error: partnerError } = await supabase
    .from('users')
    .select('id, name, username')
    .eq('id', partnerId)
    .single();

  if (partnerError) throw partnerError;
  if (!partnerData) throw new Error('Partner not found');

  // Get partnership status
  const { data: partnershipData } = await supabase
    .from('workout_partners')
    .select('is_favorite')
    .eq('partner_id', partnerId)
    .eq('status', 'accepted')
    .single();

  // Get their workouts for current week
  const { data: workouts, error: workoutsError } = await supabase
    .from('daily_workouts')
    .select(`
      id,
      completed,
      exercises (
        id,
        name,
        exercise_sets (
          weight,
          completed,
          user_id
        )
      )
    `)
    .eq('user_id', partnerId)
    .gte('date', startOfWeek.toISOString())
    .lte('date', today.toISOString())
    .order('date', { ascending: true });

  if (workoutsError) throw workoutsError;

  // Calculate total weight lifted
  const totalWeight = workouts?.reduce((sum, workout) => {
    return sum + (workout.exercises?.reduce((exSum, ex) => {
      return exSum + (ex.exercise_sets?.reduce((setSum, set) => {
        return setSum + (set.completed ? (set.weight || 0) : 0);
      }, 0) || 0);
    }, 0) || 0);
  }, 0) || 0;

  // Calculate completion rate
  const totalWorkouts = workouts?.length || 0;
  const completedWorkouts = workouts?.filter(w => w.completed).length || 0;
  const completionRate = totalWorkouts > 0 
    ? Math.round((completedWorkouts / totalWorkouts) * 100)
    : 0;

  // Calculate weekly progress
  const weeklyProgress = workouts?.map(workout => {
    const totalSets = workout.exercises?.reduce((total, ex) => 
      total + (ex.exercise_sets?.length || 0), 0) || 0;
    const completedSets = workout.exercises?.reduce((total, ex) => 
      total + (ex.exercise_sets?.filter(set => set.completed)?.length || 0), 0) || 0;
    return totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  }) || [];

  return {
    name: partnerData.name,
    username: partnerData.username,
    isFavorite: partnershipData?.is_favorite || false,
    weeklyWorkouts: totalWorkouts,
    completedWorkouts: completedWorkouts,
    totalWeight: totalWeight,
    completionRate: completionRate,
    weeklyProgress
  };
}

export async function toggleFavoritePartner(partnerId: string, isFavorite: boolean) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get current user's database ID
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single();
  if (!userData) throw new Error('User profile not found');

  const { error } = await supabase
    .from('workout_partners')
    .update({ is_favorite: isFavorite })
    .eq('user_id', userData.id)
    .eq('partner_id', partnerId)
    .eq('status', 'accepted');

  if (error) throw error;
}