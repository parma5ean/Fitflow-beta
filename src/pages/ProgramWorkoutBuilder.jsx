import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Save, Plus, GripVertical, Trash2, Copy, Eye, LayoutGrid, List } from "lucide-react";
import { createPageUrl } from "@/utils";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import ExerciseSelector from "../components/workouts/ExerciseSelector";
import ExerciseConfigPanel from "../components/programs/ExerciseConfigPanel";
import ExerciseGridCard from "../components/programs/ExerciseGridCard";

export default function ProgramWorkoutBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const params = new URLSearchParams(location.search);
  const programId = params.get('programId');
  const workoutId = params.get('workoutId');

  const [workout, setWorkout] = useState(null);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [expandedExercises, setExpandedExercises] = useState(new Set());
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

  const { data: program } = useQuery({
    queryKey: ['program', programId],
    queryFn: async () => {
      const programs = await base44.entities.Program.filter({ id: programId });
      return programs[0] || null;
    },
    enabled: !!programId
  });

  const { data: workoutData, isLoading } = useQuery({
    queryKey: ['programWorkout', workoutId],
    queryFn: async () => {
      const workouts = await base44.entities.ProgramWorkout.filter({ id: workoutId });
      return workouts[0] || null;
    },
    enabled: !!workoutId
  });

  // Fetch exercise details for video URLs and descriptions
  const { data: exerciseDetailsMap } = useQuery({
    queryKey: ['exerciseDetails', workoutData?.exercises],
    queryFn: async () => {
      if (!workoutData?.exercises) return {};
      
      const exerciseIds = workoutData.exercises
        .map(ex => ex.exercise_id)
        .filter(id => id);

      if (exerciseIds.length === 0) return {};

      const exercises = await base44.entities.Exercise.filter({
        id: exerciseIds
      });

      const map = {};
      exercises.forEach(ex => {
        map[ex.id] = ex;
      });

      return map;
    },
    enabled: !!workoutData?.exercises,
    initialData: {}
  });

  useEffect(() => {
    if (workoutData) {
      setWorkout(workoutData);
    }
  }, [workoutData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.ProgramWorkout.update(workoutId, {
        exercises: workout.exercises
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programWorkout', workoutId] });
      queryClient.invalidateQueries({ queryKey: ['programWorkouts', programId] });
      alert('Workout saved successfully!');
      navigate(createPageUrl('ProgramBuilder') + `?programId=${programId}`);
    }
  });

  // Autosave on changes
  useEffect(() => {
    if (workout && workoutData && JSON.stringify(workout.exercises) !== JSON.stringify(workoutData.exercises)) {
      const timer = setTimeout(() => {
        saveMutation.mutate();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [workout]);

  const handleAddExercise = (exercise) => {
    const defaultSets = getDefaultSetsByGoal(program?.goal || 'hypertrophy');
    
    const newExercise = {
      exercise_id: exercise.id,
      custom_name: exercise.name,
      order_index: workout.exercises.length,
      sets_data: Array.from({ length: defaultSets.sets }, (_, i) => ({
        set_number: i + 1,
        reps: defaultSets.reps,
        weight: 0,
        rest_seconds: defaultSets.rest,
        tempo: defaultSets.tempo || '',
        rpe: null,
        rir: null,
        is_warmup: false,
        is_dropset: false
      })),
      notes: '',
      superset_with: null,
      track_progress: true
    };

    setWorkout({
      ...workout,
      exercises: [...workout.exercises, newExercise]
    });
    setShowExerciseSelector(false);
  };

  const handleUpdateExercise = (index, updates) => {
    const updated = [...workout.exercises];
    updated[index] = { ...updated[index], ...updates };
    setWorkout({ ...workout, exercises: updated });
  };

  const handleDeleteExercise = (index) => {
    if (confirm('Delete this exercise?')) {
      const updated = workout.exercises.filter((_, i) => i !== index);
      updated.forEach((ex, i) => ex.order_index = i);
      setWorkout({ ...workout, exercises: updated });
    }
  };

  const handleDuplicateExercise = (index) => {
    const exerciseToDuplicate = workout.exercises[index];
    const duplicated = {
      ...JSON.parse(JSON.stringify(exerciseToDuplicate)),
      order_index: workout.exercises.length
    };
    setWorkout({
      ...workout,
      exercises: [...workout.exercises, duplicated]
    });
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(workout.exercises);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    
    items.forEach((ex, i) => ex.order_index = i);
    setWorkout({ ...workout, exercises: items });
  };

  const toggleExpanded = (index) => {
    const newExpanded = new Set(expandedExercises);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedExercises(newExpanded);
  };

  const getDefaultSetsByGoal = (goal) => {
    switch (goal) {
      case 'strength':
        return { sets: 4, reps: '5', rest: 180, tempo: '3-1-1-0' };
      case 'hypertrophy':
        return { sets: 4, reps: '8-12', rest: 90, tempo: '2-0-2-0' };
      case 'fat_loss':
        return { sets: 3, reps: '12-15', rest: 60, tempo: '1-0-1-0' };
      case 'endurance':
        return { sets: 3, reps: '15-20', rest: 45, tempo: '1-0-1-0' };
      case 'mobility':
        return { sets: 2, reps: '10-15', rest: 30, tempo: '1-0-1-0' };
      default:
        return { sets: 3, reps: '10', rest: 90, tempo: '2-0-2-0' };
    }
  };

  const calculateWorkoutStats = () => {
    const totalSets = workout?.exercises.reduce((sum, ex) => sum + (ex.sets_data?.length || 0), 0) || 0;
    const estimatedTime = workout?.exercises.reduce((sum, ex) => {
      const sets = ex.sets_data?.length || 0;
      const avgRestTime = ex.sets_data?.[0]?.rest_seconds || 90;
      return sum + (sets * 30) + ((sets - 1) * avgRestTime);
    }, 0) || 0;
    
    return {
      totalSets,
      estimatedTime: Math.round(estimatedTime / 60)
    };
  };

  if (!programId || !workoutId) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="glass-strong rounded-3xl p-8 text-center shadow-2xl">
          <p className="text-white/70">Invalid program or workout</p>
        </div>
      </div>
    );
  }

  if (isLoading || !workout) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const stats = calculateWorkoutStats();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-strong rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(createPageUrl('ProgramBuilder') + `?programId=${programId}`)}
            className="glass p-2 rounded-xl hover:glass-strong transition-all duration-300"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(createPageUrl('ProgramPreview') + `?programId=${programId}&workoutId=${workoutId}`)}
              className="glass px-4 py-2 rounded-xl text-white hover:glass-strong transition-all duration-300 flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="glass px-6 py-3 rounded-xl text-white hover:glass-strong transition-all duration-300 flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <h1 className="text-3xl font-light text-white mb-2">{workout.name}</h1>
        <p className="text-white/70 mb-4">{program?.name} - Week {workout.week_number}</p>
        
        <div className="flex gap-4 text-sm text-white/80">
          <span>{workout.exercises.length} exercises</span>
          <span>•</span>
          <span>{stats.totalSets} total sets</span>
          <span>•</span>
          <span>~{stats.estimatedTime} min</span>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-light text-white">Exercises</h2>
        <div className="glass rounded-xl p-1 flex gap-1">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
              viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/50'
            }`}
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">List</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
              viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/50'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Grid</span>
          </button>
        </div>
      </div>

      {/* Exercise List/Grid */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="exercises" direction={viewMode === 'grid' ? 'horizontal' : 'vertical'}>
            {(provided) => (
              <div 
                {...provided.droppableProps} 
                ref={provided.innerRef} 
                className={viewMode === 'grid' ? 'contents' : 'space-y-3'}
              >
                {workout.exercises.map((exercise, index) => (
                  <Draggable key={index} draggableId={`exercise-${index}`} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`transition-all duration-300 ${
                          snapshot.isDragging ? 'scale-105 z-50' : ''
                        }`}
                      >
                        {viewMode === 'list' ? (
                          <div className="glass-strong rounded-2xl">
                            {/* Exercise Header */}
                            <div className="p-4 flex items-center gap-3">
                              <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                <GripVertical className="w-5 h-5 text-white/50" />
                              </div>
                              
                              <div className="flex-1">
                                <h3 className="text-white font-light text-lg">{exercise.custom_name}</h3>
                                <p className="text-white/60 text-sm">
                                  {exercise.sets_data.length} sets
                                  {exercise.superset_with !== null && ' • Superset'}
                                </p>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => toggleExpanded(index)}
                                  className="glass px-3 py-2 rounded-lg hover:glass-strong transition-all duration-200 text-white text-sm"
                                >
                                  {expandedExercises.has(index) ? 'Collapse' : 'Expand'}
                                </button>
                                <button
                                  onClick={() => handleDuplicateExercise(index)}
                                  className="glass p-2 rounded-lg hover:glass-strong transition-all duration-200"
                                  title="Duplicate"
                                >
                                  <Copy className="w-4 h-4 text-white" />
                                </button>
                                <button
                                  onClick={() => handleDeleteExercise(index)}
                                  className="glass p-2 rounded-lg hover:glass-strong transition-all duration-200 text-red-400"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Expanded Exercise Config */}
                            {expandedExercises.has(index) && (
                              <div className="border-t border-white/10 p-4">
                                <ExerciseConfigPanel
                                  exercise={exercise}
                                  exerciseDetails={exerciseDetailsMap[exercise.exercise_id]}
                                  programGoal={program?.goal}
                                  onUpdate={(updates) => handleUpdateExercise(index, updates)}
                                  availableExercises={workout.exercises}
                                  currentIndex={index}
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <ExerciseGridCard
                            exercise={exercise}
                            exerciseDetails={exerciseDetailsMap[exercise.exercise_id]}
                            index={index}
                            dragHandleProps={provided.dragHandleProps}
                            onEdit={() => {
                              toggleExpanded(index);
                              setViewMode('list');
                            }}
                            onDuplicate={() => handleDuplicateExercise(index)}
                            onDelete={() => handleDeleteExercise(index)}
                          />
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* Add Exercise Button */}
        <button
          onClick={() => setShowExerciseSelector(true)}
          className={`glass rounded-2xl p-6 text-white hover:glass-strong transition-all duration-300 flex items-center justify-center gap-3 ${
            viewMode === 'grid' ? '' : 'w-full'
          }`}
        >
          <Plus className="w-6 h-6" />
          <span className="text-lg font-light">Add Exercise</span>
        </button>
      </div>

      <ExerciseSelector
        open={showExerciseSelector}
        onClose={() => setShowExerciseSelector(false)}
        onSelect={handleAddExercise}
      />
    </div>
  );
}