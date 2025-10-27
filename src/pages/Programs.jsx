import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Dumbbell, Calendar, Target, Trash2, Edit, Play, Copy, Star, BookOpen, Library } from "lucide-react";
import { createPageUrl } from "@/utils";
import { format, addDays, parseISO } from "date-fns";
import CreateProgramDialog from "../components/programs/CreateProgramDialog";
import StartProgramDialog from "../components/programs/StartProgramDialog";

export default function Programs() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [programToActivate, setProgramToActivate] = useState(null);

  const { data: programs, isLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: () => base44.entities.Program.list('-created_date'),
    initialData: []
  });

  const { data: allProgramWorkouts } = useQuery({
    queryKey: ['allProgramWorkouts'],
    queryFn: () => base44.entities.ProgramWorkout.list(),
    initialData: []
  });

  const deleteMutation = useMutation({
    mutationFn: async (programId) => {
      // Delete associated workouts first
      const workouts = await base44.entities.ProgramWorkout.filter({ program_id: programId });
      await Promise.all(workouts.map(w => base44.entities.ProgramWorkout.delete(w.id)));
      
      // Delete program
      await base44.entities.Program.delete(programId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    }
  });

  const duplicateMutation = useMutation({
    mutationFn: async (program) => {
      const { id, created_date, updated_date, created_by, ...programData } = program;
      
      // Create new program
      const newProgram = await base44.entities.Program.create({
        ...programData,
        name: `${programData.name} (Copy)`,
        is_active: false,
        status: 'draft'
      });

      // Duplicate workouts
      const workouts = await base44.entities.ProgramWorkout.filter({ program_id: program.id });
      await Promise.all(workouts.map(workout => {
        const { id, created_date, updated_date, created_by, ...workoutData } = workout;
        return base44.entities.ProgramWorkout.create({
          ...workoutData,
          program_id: newProgram.id
        });
      }));

      return newProgram;
    },
    onSuccess: (newProgram) => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      navigate(createPageUrl('ProgramBuilder') + `?programId=${newProgram.id}`);
    }
  });

  const startProgramMutation = useMutation({
    mutationFn: async ({ programId, startDate, startDayOfWeek }) => {
      const program = programs.find(p => p.id === programId);
      const workouts = allProgramWorkouts.filter(w => w.program_id === programId);
      
      console.log('Starting program:', program);
      console.log('Program workouts found:', workouts.length);
      
      if (!program) {
        throw new Error('Program not found');
      }
      
      if (!workouts || workouts.length === 0) {
        throw new Error('No workouts found for this program. Please add workouts before starting.');
      }

      // Verify workouts have exercises
      const workoutsWithExercises = workouts.filter(w => w.exercises && w.exercises.length > 0);
      console.log('Workouts with exercises:', workoutsWithExercises.length);
      
      if (workoutsWithExercises.length === 0) {
        throw new Error('No exercises found in program workouts. Please add exercises to your workouts before starting.');
      }

      const startDateObj = parseISO(startDate);
      
      // Set all programs to inactive first
      await Promise.all(
        programs.map(p => 
          base44.entities.Program.update(p.id, { 
            is_active: p.id === programId,
            ...(p.id === programId && {
              start_date: startDate,
              end_date: format(addDays(startDateObj, program.duration_weeks * 7), 'yyyy-MM-dd'),
              status: 'published'
            })
          })
        )
      );

      // Define day order for indexing
      const dayOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const programStartDayIndex = dayOrder.indexOf(startDayOfWeek);
      
      console.log('Program starts on:', startDayOfWeek, 'index:', programStartDayIndex);
      
      // Create scheduled workouts from program workouts
      const scheduledWorkouts = [];

      for (const programWorkout of workouts) {
        console.log('Processing workout:', programWorkout.name, 'with', programWorkout.exercises?.length || 0, 'exercises');
        
        // Skip workouts without exercises
        if (!programWorkout.exercises || programWorkout.exercises.length === 0) {
          console.warn('Skipping workout without exercises:', programWorkout.name);
          continue;
        }

        // Calculate week offset based on program's week number (0-indexed weeks)
        const weekOffset = (programWorkout.week_number - 1) * 7;
        
        // Calculate day offset for the current workout relative to the selected start day
        const workoutDayIndex = dayOrder.indexOf(programWorkout.day_of_week);
        let dayOffset = workoutDayIndex - programStartDayIndex;
        
        // Adjust dayOffset to ensure it's positive and wraps around the week
        if (dayOffset < 0) {
          dayOffset += 7;
        }
        
        // Calculate the actual scheduled date based on the chosen start date, week offset, and adjusted day offset
        const scheduledDate = addDays(startDateObj, weekOffset + dayOffset);

        console.log('Scheduling', programWorkout.name, 'for', format(scheduledDate, 'yyyy-MM-dd'));

        const workoutData = {
          name: programWorkout.name,
          description: programWorkout.description,
          plan_id: null,
          program_id: programId,
          scheduled_date: format(scheduledDate, 'yyyy-MM-dd'),
          is_template: false,
          is_completed: false,
          sections: [{
            section_name: 'main',
            exercises: programWorkout.exercises.map(ex => {
              console.log('Mapping exercise:', ex.custom_name, 'with', ex.sets_data?.length || 0, 'sets');
              return {
                exercise_id: ex.exercise_id,
                custom_name: ex.custom_name,
                sets_data: (ex.sets_data || []).map((set, idx) => ({
                  set_number: idx + 1,
                  reps: set.reps || '10',
                  weight: set.weight || 0,
                  rest_seconds: set.rest_seconds || 90,
                  tempo: set.tempo || '',
                  rpe: set.rpe || null,
                  rir: set.rir || null,
                  completed: false,
                  feedback: null,
                  note: ''
                })),
                rest_period_seconds: ex.sets_data?.[0]?.rest_seconds || 90,
                notes_for_exercise: ex.notes || '',
                workout_notes: '',
                is_superset: ex.superset_with !== null
              };
            })
          }]
        };

        console.log('Created workout data for', workoutData.name, ':', JSON.stringify(workoutData.sections, null, 2));

        scheduledWorkouts.push(base44.entities.Workout.create(workoutData));
      }

      if (scheduledWorkouts.length === 0) {
        throw new Error('No valid workouts to schedule. Please ensure your program workouts have exercises.');
      }

      console.log('Creating', scheduledWorkouts.length, 'scheduled workouts');
      await Promise.all(scheduledWorkouts);
      console.log('All workouts created successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['scheduledWorkouts'] });
      queryClient.invalidateQueries({ queryKey: ['todayWorkouts'] });
      queryClient.invalidateQueries({ queryKey: ['activeProgram'] });
      setShowStartDialog(false);
      setProgramToActivate(null);
      alert('Program started successfully!');
    },
    onError: (error) => {
      console.error('Error starting program:', error);
      alert(`Failed to start program: ${error.message}`);
    }
  });

  const handleStartProgram = (startDate, startDayOfWeek) => {
    if (!programToActivate) return;
    startProgramMutation.mutate({
      programId: programToActivate.id,
      startDate,
      startDayOfWeek
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-green-500/20 text-green-400';
      case 'draft': return 'bg-yellow-500/20 text-yellow-400';
      case 'archived': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-white/20 text-white';
    }
  };

  const getProgramWorkouts = (programId) => {
    return allProgramWorkouts.filter(w => w.program_id === programId);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-strong rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Dumbbell className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-3xl md:text-4xl font-light text-white">Training Programs</h1>
              <p className="text-white/70">Build and manage comprehensive training programs</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="glass px-6 py-3 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300 shadow-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Program
          </button>
        </div>

        {/* Quick Access Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate(createPageUrl('ExerciseLibrary'))}
            className="glass rounded-2xl p-4 hover:glass-strong transition-all duration-300 flex items-center gap-4 text-left group"
          >
            <div className="glass p-3 rounded-xl group-hover:scale-110 transition-transform">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-light text-lg">Exercise Library</h3>
              <p className="text-white/70 text-sm">Browse and manage exercises</p>
            </div>
          </button>

          <button
            onClick={() => navigate(createPageUrl('WorkoutTemplates'))}
            className="glass rounded-2xl p-4 hover:glass-strong transition-all duration-300 flex items-center gap-4 text-left group"
          >
            <div className="glass p-3 rounded-xl group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-light text-lg">Workout Templates</h3>
              <p className="text-white/70 text-sm">View and create workout templates</p>
            </div>
          </button>
        </div>
      </div>

      {/* Programs List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      ) : programs.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((program) => (
            <div
              key={program.id}
              className="glass-strong rounded-3xl p-6 shadow-2xl hover:scale-105 transition-all duration-300"
            >
              {/* Status & Active Badge */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-3 py-1 rounded-lg text-xs font-light ${getStatusColor(program.status)}`}>
                  {program.status}
                </span>
                {program.is_active && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-white fill-white" />
                    <span className="text-white text-xs">Active</span>
                  </div>
                )}
                {program.is_ai_generated && (
                  <span className="text-white/60 text-xs">✨ AI</span>
                )}
              </div>

              {/* Program Info */}
              <h3 className="text-2xl font-light text-white mb-2">{program.name}</h3>
              {program.description && (
                <p className="text-white/70 text-sm mb-4 line-clamp-2">{program.description}</p>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{program.duration_weeks} weeks • {program.days_per_week} days/week</span>
                </div>
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <Target className="w-4 h-4" />
                  <span className="capitalize">{program.goal} • {program.difficulty}</span>
                </div>
                {program.start_date && (
                  <div className="text-white/60 text-xs">
                    Started: {format(new Date(program.start_date), 'MMM d, yyyy')}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(createPageUrl('ProgramBuilder') + `?programId=${program.id}`)}
                  className="flex-1 glass px-4 py-3 rounded-xl text-white font-light hover:glass-strong transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => duplicateMutation.mutate(program)}
                  disabled={duplicateMutation.isPending}
                  className="glass px-4 py-3 rounded-xl text-white hover:glass-strong transition-all duration-300"
                  title="Duplicate"
                >
                  <Copy className="w-4 h-4" />
                </button>
                {!program.is_active && (
                  <button
                    onClick={() => {
                      setProgramToActivate(program);
                      setShowStartDialog(true);
                    }}
                    className="glass px-4 py-3 rounded-xl text-white hover:glass-strong transition-all duration-300"
                    title="Start Program"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm(`Delete "${program.name}"? This will also delete all associated workouts.`)) {
                      deleteMutation.mutate(program.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="glass px-4 py-3 rounded-xl text-red-400 hover:glass-strong transition-all duration-300"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-strong rounded-3xl p-12 text-center shadow-2xl">
          <Dumbbell className="w-16 h-16 text-white/30 mx-auto mb-6" />
          <h3 className="text-2xl font-light text-white mb-2">No Programs Yet</h3>
          <p className="text-white/70 mb-6">Create your first training program to get started</p>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="glass px-8 py-4 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            Create Your First Program
          </button>
        </div>
      )}

      <CreateProgramDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />

      {programToActivate && (
        <StartProgramDialog
          open={showStartDialog}
          onClose={() => {
            setShowStartDialog(false);
            setProgramToActivate(null);
          }}
          program={programToActivate}
          workouts={getProgramWorkouts(programToActivate.id)}
          onConfirm={handleStartProgram}
        />
      )}
    </div>
  );
}