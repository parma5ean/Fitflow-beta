
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Play, Calendar, Dumbbell, Clock, Target } from "lucide-react";
import { createPageUrl } from "@/utils";
import { format, addDays, parseISO } from "date-fns";
import StartProgramDialog from "../components/programs/StartProgramDialog";

export default function ProgramPreview() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = new URLSearchParams(useLocation().search);
  const programId = params.get('programId');
  const [showStartDialog, setShowStartDialog] = useState(false);

  const { data: program, isLoading: isLoadingProgram } = useQuery({
    queryKey: ['program', programId],
    queryFn: async () => {
      const programs = await base44.entities.Program.filter({ id: programId });
      return programs[0] || null;
    },
    enabled: !!programId
  });

  const { data: workouts, isLoading: isLoadingWorkouts } = useQuery({
    queryKey: ['programWorkouts', programId],
    queryFn: () => base44.entities.ProgramWorkout.filter({ program_id: programId }),
    enabled: !!programId,
    initialData: []
  });

  const startProgramMutation = useMutation({
    mutationFn: async ({ startDate, firstWorkoutId }) => {
      const startDateObj = parseISO(startDate);
      
      // Update program status and dates
      await base44.entities.Program.update(programId, {
        is_active: true,
        start_date: startDate,
        end_date: format(addDays(startDateObj, program.duration_weeks * 7), 'yyyy-MM-dd'),
        status: 'published'
      });

      // Find the first workout that was selected to define the start day of the week
      const firstWorkout = workouts.find(w => w.id === firstWorkoutId);
      if (!firstWorkout) throw new Error('First workout not found');

      // Define day order for indexing
      const dayOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const firstWorkoutDayIndex = dayOrder.indexOf(firstWorkout.day_of_week);
      
      // Create scheduled workouts from program workouts
      const scheduledWorkouts = [];

      for (const programWorkout of workouts) {
        // Calculate week offset based on program's week number (0-indexed weeks)
        const weekOffset = (programWorkout.week_number - 1) * 7;
        
        // Calculate day offset for the current workout relative to the selected first workout's day
        const workoutDayIndex = dayOrder.indexOf(programWorkout.day_of_week);
        let dayOffset = workoutDayIndex - firstWorkoutDayIndex;
        
        // Adjust dayOffset to ensure it's positive and wraps around the week
        if (dayOffset < 0) {
          dayOffset += 7;
        }
        
        // Calculate the actual scheduled date based on the chosen start date, week offset, and adjusted day offset
        const scheduledDate = addDays(startDateObj, weekOffset + dayOffset);

        const workoutData = {
          name: programWorkout.name,
          description: programWorkout.description,
          plan_id: null, // Not using old plan system
          program_id: programId,
          scheduled_date: format(scheduledDate, 'yyyy-MM-dd'),
          is_template: false,
          is_completed: false,
          sections: [{
            section_name: 'main',
            exercises: programWorkout.exercises.map(ex => ({
              exercise_id: ex.exercise_id,
              custom_name: ex.custom_name,
              sets_data: ex.sets_data.map(set => ({
                ...set,
                completed: false,
                feedback: null,
                note: ''
              })),
              rest_period_seconds: ex.sets_data[0]?.rest_seconds || 90,
              notes_for_exercise: ex.notes || '',
              is_superset: ex.superset_with !== null
            }))
          }]
        };

        scheduledWorkouts.push(base44.entities.Workout.create(workoutData));
      }

      await Promise.all(scheduledWorkouts);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['scheduledWorkouts'] });
      queryClient.invalidateQueries({ queryKey: ['todayWorkouts'] });
      alert('Program started successfully!');
      navigate(createPageUrl('Programs'));
    }
  });

  if (isLoadingProgram || isLoadingWorkouts) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="glass-strong rounded-3xl p-8 text-center shadow-2xl">
          <p className="text-white/70">Program not found</p>
        </div>
      </div>
    );
  }

  const workoutsByWeek = workouts.reduce((acc, workout) => {
    const week = workout.week_number || 1;
    if (!acc[week]) acc[week] = [];
    acc[week].push(workout);
    return acc;
  }, {});

  // Calculate total stats
  const totalExercises = workouts.reduce((sum, w) => sum + (w.exercises?.length || 0), 0);
  const totalSets = workouts.reduce((sum, w) => 
    sum + (w.exercises?.reduce((s, e) => s + (e.sets_data?.length || 0), 0) || 0), 0
  );
  const avgDuration = workouts.reduce((sum, w) => sum + (w.estimated_duration_minutes || 60), 0) / (workouts.length || 1);

  const handleStartProgram = (startDate, firstWorkoutId) => {
    startProgramMutation.mutate({ startDate, firstWorkoutId });
    setShowStartDialog(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-strong rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(createPageUrl('ProgramBuilder') + `?programId=${programId}`)}
            className="glass p-2 rounded-xl hover:glass-strong transition-all duration-300"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={() => setShowStartDialog(true)}
            disabled={startProgramMutation.isPending || workouts.length === 0}
            className="glass px-8 py-4 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300 disabled:opacity-50 flex items-center gap-3"
          >
            <Play className="w-6 h-6" />
            {startProgramMutation.isPending ? 'Starting...' : 'Start This Program'}
          </button>
        </div>

        <h1 className="text-4xl font-light text-white mb-2">{program.name}</h1>
        {program.description && (
          <p className="text-white/70 text-lg mb-6">{program.description}</p>
        )}

        {/* Program Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass rounded-2xl p-4 text-center">
            <Calendar className="w-6 h-6 text-white/70 mx-auto mb-2" />
            <p className="text-2xl font-light text-white">{program.duration_weeks}</p>
            <p className="text-white/60 text-sm">Weeks</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <Dumbbell className="w-6 h-6 text-white/70 mx-auto mb-2" />
            <p className="text-2xl font-light text-white">{workouts.length}</p>
            <p className="text-white/60 text-sm">Workouts</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <Target className="w-6 h-6 text-white/70 mx-auto mb-2" />
            <p className="text-2xl font-light text-white">{totalExercises}</p>
            <p className="text-white/60 text-sm">Exercises</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <Clock className="w-6 h-6 text-white/70 mx-auto mb-2" />
            <p className="text-2xl font-light text-white">~{Math.round(avgDuration)}</p>
            <p className="text-white/60 text-sm">Min/Session</p>
          </div>
        </div>
      </div>

      {/* Weekly Breakdown */}
      {Array.from({ length: program.duration_weeks }, (_, i) => i + 1).map(weekNum => (
        <div key={weekNum} className="glass-strong rounded-3xl p-6 shadow-2xl">
          <h2 className="text-2xl font-light text-white mb-4">Week {weekNum}</h2>
          
          {workoutsByWeek[weekNum] && workoutsByWeek[weekNum].length > 0 ? (
            <div className="space-y-3">
              {workoutsByWeek[weekNum].map((workout) => (
                <div key={workout.id} className="glass rounded-2xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-white font-light text-lg">{workout.name}</h3>
                      {workout.day_of_week && workout.day_of_week !== 'unassigned' && (
                        <p className="text-white/60 text-sm capitalize">{workout.day_of_week}</p>
                      )}
                    </div>
                    <div className="text-right text-sm text-white/70">
                      <p>{workout.exercises?.length || 0} exercises</p>
                      <p>{workout.exercises?.reduce((sum, ex) => sum + (ex.sets_data?.length || 0), 0) || 0} sets</p>
                    </div>
                  </div>

                  {workout.exercises && workout.exercises.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {workout.exercises.slice(0, 5).map((ex, idx) => (
                        <div key={idx} className="flex justify-between text-sm text-white/70">
                          <span>{ex.custom_name}</span>
                          <span>{ex.sets_data?.length || 0} sets</span>
                        </div>
                      ))}
                      {workout.exercises.length > 5 && (
                        <p className="text-white/50 text-xs">+{workout.exercises.length - 5} more...</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/50 text-center py-8">No workouts scheduled for this week</p>
          )}
        </div>
      ))}

      <StartProgramDialog
        open={showStartDialog}
        onClose={() => setShowStartDialog(false)}
        program={program}
        workouts={workouts}
        onConfirm={handleStartProgram}
      />
    </div>
  );
}
