
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Save, Plus, Eye } from "lucide-react";
import { createPageUrl } from "@/utils";
import ProgramWorkoutCard from "../components/programs/ProgramWorkoutCard";
import AddWorkoutDialog from "../components/programs/AddWorkoutDialog";

export default function ProgramBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const programId = new URLSearchParams(location.search).get('programId');

  const [showAddWorkoutDialog, setShowAddWorkoutDialog] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [editingWorkout, setEditingWorkout] = useState(null);

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

  const updateProgramMutation = useMutation({
    mutationFn: (updates) => base44.entities.Program.update(programId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program', programId] });
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      alert('Program published successfully!');
      navigate(createPageUrl('Programs'));
    }
  });

  const deleteWorkoutMutation = useMutation({
    mutationFn: (workoutId) => base44.entities.ProgramWorkout.delete(workoutId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programWorkouts', programId] });
    }
  });

  const duplicateWorkoutMutation = useMutation({
    mutationFn: async (workout) => {
      const { id, created_date, updated_date, created_by, ...workoutData } = workout;
      return await base44.entities.ProgramWorkout.create({
        ...workoutData,
        name: `${workoutData.name} (Copy)`,
        order_index: workouts.length
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programWorkouts', programId] });
    }
  });

  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayLabels = {
    sunday: 'Sun',
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat'
  };

  // Get ALL workouts for a specific day (supporting multiple workouts per day)
  const getWorkoutsForDay = (weekNum, day) => {
    return workouts.filter(w => w.week_number === weekNum && w.day_of_week === day);
  };

  const handleAddWorkout = (weekNum, day) => {
    setSelectedWeek(weekNum);
    setSelectedDay(day);
    setEditingWorkout(null);
    setShowAddWorkoutDialog(true);
  };

  const handleEditWorkout = (workout) => {
    setSelectedWeek(workout.week_number);
    setSelectedDay(workout.day_of_week);
    setEditingWorkout(workout);
    setShowAddWorkoutDialog(true);
  };

  if (!programId) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="glass-strong rounded-3xl p-8 text-center shadow-2xl">
          <p className="text-white/70 mb-4">No program selected</p>
          <button
            onClick={() => navigate(createPageUrl('Programs'))}
            className="glass px-6 py-3 rounded-xl text-white hover:glass-strong transition-all duration-300"
          >
            Return to Programs
          </button>
        </div>
      </div>
    );
  }

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
          <p className="text-white/70 mb-4">Program not found</p>
          <button
            onClick={() => navigate(createPageUrl('Programs'))}
            className="glass px-6 py-3 rounded-xl text-white hover:glass-strong transition-all duration-300"
          >
            Return to Programs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="glass-strong rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(createPageUrl('Programs'))}
            className="glass p-2 rounded-xl hover:glass-strong transition-all duration-300"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(createPageUrl('ProgramPreview') + `?programId=${programId}`)}
              disabled={workouts.length === 0}
              className="glass px-4 md:px-6 py-3 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
            >
              <Eye className="w-5 h-5" />
              <span className="hidden sm:inline">Preview</span>
            </button>
            <button
              onClick={() => updateProgramMutation.mutate({ status: 'published' })}
              disabled={updateProgramMutation.isPending || workouts.length === 0}
              className="glass px-4 md:px-6 py-3 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              <span className="hidden sm:inline">{updateProgramMutation.isPending ? 'Publishing...' : 'Publish'}</span>
            </button>
          </div>
        </div>

        <h1 className="text-2xl md:text-4xl font-light text-white mb-2">{program.name}</h1>
        {program.description && (
          <p className="text-white/70 mb-4 text-sm md:text-base">{program.description}</p>
        )}

        <div className="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm">
          <div className="flex items-center gap-2 text-white/80">
            <span>{program.duration_weeks} weeks</span>
          </div>
          <div className="flex items-center gap-2 text-white/80">
            <span className="capitalize">{program.goal} • {program.difficulty}</span>
          </div>
          <div className="flex items-center gap-2 text-white/80">
            <span>{workouts.length} workouts</span>
          </div>
        </div>
      </div>

      {/* Weekly Grid */}
      {Array.from({ length: program.duration_weeks }, (_, i) => i + 1).map(weekNum => (
        <div key={weekNum} className="space-y-3">
          <h2 className="text-xl md:text-2xl font-light text-white px-2">Week {weekNum}</h2>
          
          <div className="glass-strong overflow-hidden"> {/* Changed: Removed rounded-2xl md:rounded-3xl */}
            <div className="grid grid-cols-7">
              {daysOfWeek.map((day, dayIndex) => {
                const dayWorkouts = getWorkoutsForDay(weekNum, day);
                
                return (
                  <div 
                    key={day} 
                    className={`p-1.5 md:p-2 flex flex-col ${
                      dayIndex < 6 ? 'border-r border-white/10' : ''
                    }`}
                  >
                    {/* Day Label */}
                    <div className="text-white/70 text-[10px] md:text-sm font-light mb-1.5 text-center flex-shrink-0">
                      {dayLabels[day]}
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      {/* Existing Workouts */}
                      {dayWorkouts.map((workout) => (
                        <div key={workout.id} className="glass rounded-md p-1 md:p-1.5 hover:glass-strong transition-all duration-200 flex-shrink-0">
                          <div className="flex flex-col gap-0.5">
                            <p className="text-white text-[9px] md:text-xs font-light line-clamp-1">{workout.name}</p>
                            <div className="flex gap-0.5">
                              <button
                                onClick={() => navigate(createPageUrl('ProgramWorkoutBuilder') + `?programId=${programId}&workoutId=${workout.id}`)}
                                className="flex-1 glass px-0.5 py-0.5 rounded text-[8px] md:text-[10px] text-white/70 hover:text-white transition-all"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Delete "${workout.name}"?`)) {
                                    deleteWorkoutMutation.mutate(workout.id);
                                  }
                                }}
                                className="flex-1 glass px-0.5 py-0.5 rounded text-[8px] md:text-[10px] text-red-400 hover:text-red-300 transition-all"
                              >
                                Del
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Add Workout Button */}
                      <button
                        onClick={() => handleAddWorkout(weekNum, day)}
                        className="glass rounded-md md:rounded-lg p-2 md:p-3 hover:glass-strong transition-all duration-300 flex items-center justify-center flex-shrink-0"
                      >
                        <Plus className="w-5 h-5 md:w-5 md:h-5 text-white/70" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}

      <AddWorkoutDialog
        open={showAddWorkoutDialog}
        onClose={() => {
          setShowAddWorkoutDialog(false);
          setEditingWorkout(null);
          setSelectedWeek(null);
          setSelectedDay(null);
        }}
        programId={programId}
        program={program}
        weekNumber={selectedWeek}
        dayOfWeek={selectedDay}
        existingWorkout={editingWorkout}
        workoutsCount={workouts.length}
      />
    </div>
  );
}
