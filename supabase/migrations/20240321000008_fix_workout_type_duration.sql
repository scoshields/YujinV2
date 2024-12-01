-- Add workout_type to daily_workouts if it doesn't exist
ALTER TABLE daily_workouts
DROP COLUMN IF EXISTS workout_type;

ALTER TABLE daily_workouts
ADD COLUMN workout_type TEXT NOT NULL DEFAULT 'strength'
CHECK (workout_type IN ('strength', 'weight_loss'));

-- Update duration calculation
CREATE OR REPLACE FUNCTION calculate_workout_duration(workout_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_duration INTEGER;
  workout_type TEXT;
BEGIN
  -- Get the workout type
  SELECT d.workout_type INTO workout_type
  FROM daily_workouts d
  WHERE d.id = workout_id;

  -- Calculate total duration based on workout type and total sets
  SELECT 
    CASE 
      WHEN workout_type = 'strength' THEN SUM(target_sets) * 3  -- 3 minutes per set
      ELSE SUM(target_sets) * 2  -- 2 minutes per set for weight loss
    END INTO total_duration
  FROM workout_exercises
  WHERE daily_workout_id = workout_id;

  RETURN COALESCE(total_duration, 0);
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update duration when exercises change
CREATE OR REPLACE FUNCTION update_workout_duration()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE daily_workouts
  SET duration = calculate_workout_duration(NEW.daily_workout_id)
  WHERE id = NEW.daily_workout_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_workout_duration_trigger ON workout_exercises;

-- Create trigger for workout_exercises
CREATE TRIGGER update_workout_duration_trigger
AFTER INSERT OR UPDATE OR DELETE ON workout_exercises
FOR EACH ROW EXECUTE FUNCTION update_workout_duration();