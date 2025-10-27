import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Save, Plus, Trash2, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPageUrl } from "@/utils";
import ExerciseSelector from "../components/workouts/ExerciseSelector";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function WorkoutPlanBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const planId = new URLSearchParams(location.search).get('planId');

  const [planData, setPlanData] = useState({
    name: "",
    description: "",
    goal: "general_fitness",
    duration_weeks: 12,
    days_per_week: 4
  });

  const [workouts, setWorkouts] = useState([]);
  const [selectedWorkoutIndex, setSelectedWorkoutIndex] = useState(null);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);

  const { data: existingPlan } = useQuery({
    queryKey: ['workoutPlan', planId],
    queryFn: async () => {
      if (!planId) return null;
      const plans = await base44.entities.WorkoutPlan.filter({ id: planId });
      return plans[0] || null;
    },
    enabled: !!planId
  });

  const { data: existingWorkouts } = useQuery({
    queryKey: ['planWorkouts', planId],
    queryFn: () => base44.entities.Workout.filter({ plan_id: planId, is_template: true }),
    enabled: !!planId,
    initialData: []
  });

  useEffect(() => {
    if (existingPlan) {
      setPlanData({
        name: existingPlan.name,
        description: existingPlan.description || "",
        goal: existingPlan.goal,
        duration_weeks: existingPlan.duration_weeks || 12,
        days_per_week: existingPlan.days_per_week || 4
      });
    }
  }, [existingPlan]);

  useEffect(() => {
    if (existingWorkouts.length > 0) {
      setWorkouts(existingWorkouts);
    }
  }, [existingWorkouts]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      let savedPlanId = planId;

      if (planId) {
        await base44.entities.WorkoutPlan.update(planId, planData);
      } else {
        const newPlan = await base44.entities.WorkoutPlan.create(planData);
        savedPlanId = newPlan.id;
      }

      // Delete existing template workouts for this plan
      for (const workout of existingWorkouts) {
        await base44.entities.Workout.delete(workout.id);
      }

      // Create new workouts
      for (const workout of workouts) {
        await base44.entities.Workout.create({
          ...workout,
          plan_id: savedPlanId,
          is_template: true
        });
      }

      return savedPlanId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutPlans'] });
      queryClient.invalidateQueries({ queryKey: ['planWorkouts'] });
      navigate(createPageUrl('Workouts'));
    }
  });

  const addWorkout = () => {
    setWorkouts([
      ...workouts,
      {
        name: `Workout ${workouts.length + 1}`,
        day: `Day ${workouts.length + 1}`,
        exercises: []
      }
    ]);
  };

  const updateWorkout = (index, field, value) => {
    const updated = [...workouts];
    updated[index] = { ...updated[index], [field]: value };
    setWorkouts(updated);
  };

  const deleteWorkout = (index) => {
    setWorkouts(workouts.filter((_, i) => i !== index));
  };

  const addExerciseToWorkout = (exercise) => {
    if (selectedWorkoutIndex === null) return;

    const updated = [...workouts];
    updated[selectedWorkoutIndex].exercises.push({
      exercise_id: exercise.id,
      custom_name: exercise.name,
      sets_data: [
        { set_number: 1, reps: "10", weight: 0, completed: false },
        { set_number: 2, reps: "10", weight: 0, completed: false },
        { set_number: 3, reps: "10", weight: 0, completed: false }
      ],
      rest_period_seconds: 90,
      notes_for_exercise: "",
      is_superset: false
    });
    setWorkouts(updated);
    setShowExerciseSelector(false);
  };

  const updateExerciseInWorkout = (workoutIndex, exerciseIndex, field, value) => {
    const updated = [...workouts];
    updated[workoutIndex].exercises[exerciseIndex] = {
      ...updated[workoutIndex].exercises[exerciseIndex],
      [field]: value
    };
    setWorkouts(updated);
  };

  const deleteExerciseFromWorkout = (workoutIndex, exerciseIndex) => {
    const updated = [...workouts];
    updated[workoutIndex].exercises = updated[workoutIndex].exercises.filter((_, i) => i !== exerciseIndex);
    setWorkouts(updated);
  };

  const updateSetData = (workoutIndex, exerciseIndex, setIndex, field, value) => {
    const updated = [...workouts];
    updated[workoutIndex].exercises[exerciseIndex].sets_data[setIndex] = {
      ...updated[workoutIndex].exercises[exerciseIndex].sets_data[setIndex],
      [field]: value
    };
    setWorkouts(updated);
  };

  const addSetToExercise = (workoutIndex, exerciseIndex) => {
    const updated = [...workouts];
    const setsData = updated[workoutIndex].exercises[exerciseIndex].sets_data;
    const lastSet = setsData[setsData.length - 1];
    setsData.push({
      set_number: setsData.length + 1,
      reps: lastSet?.reps || "10",
      weight: lastSet?.weight || 0,
      completed: false
    });
    setWorkouts(updated);
  };

  const removeSetFromExercise = (workoutIndex, exerciseIndex, setIndex) => {
    const updated = [...workouts];
    updated[workoutIndex].exercises[exerciseIndex].sets_data = 
      updated[workoutIndex].exercises[exerciseIndex].sets_data.filter((_, i) => i !== setIndex);
    setWorkouts(updated);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    if (type === 'workout') {
      const reordered = Array.from(workouts);
      const [removed] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, removed);
      setWorkouts(reordered);
    } else if (type === 'exercise') {
      const workoutIndex = parseInt(source.droppableId.split('-')[1]);
      const updated = [...workouts];
      const exercises = Array.from(updated[workoutIndex].exercises);
      const [removed] = exercises.splice(source.index, 1);
      exercises.splice(destination.index, 0, removed);
      updated[workoutIndex].exercises = exercises;
      setWorkouts(updated);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="glass-strong rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(createPageUrl('Workouts'))}
            className="glass p-2 rounded-xl hover:glass-strong transition-all duration-300"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-3xl font-light text-white">
            {planId ? 'Edit Workout Plan' : 'Create Workout Plan'}
          </h1>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !planData.name}
            className="glass px-6 py-3 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saveMutation.isPending ? 'Saving...' : 'Save Plan'}
          </button>
        </div>
      </div>

      {/* Plan Details */}
      <div className="glass-strong rounded-3xl p-6 shadow-2xl space-y-4">
        <h3 className="text-xl font-light text-white mb-4">Plan Details</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-white/90 font-light">Plan Name</Label>
            <Input
              value={planData.name}
              onChange={(e) => setPlanData({ ...planData, name: e.target.value })}
              className="glass border-white/20 text-white mt-1 font-light"
              placeholder="Summer Shred Program"
            />
          </div>

          <div>
            <Label className="text-white/90 font-light">Goal</Label>
            <Select
              value={planData.goal}
              onValueChange={(value) => setPlanData({ ...planData, goal: value })}
            >
              <SelectTrigger className="glass border-white/20 text-white mt-1 font-light">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-strong border-white/20">
                <SelectItem value="strength">Strength</SelectItem>
                <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                <SelectItem value="fat_loss">Fat Loss</SelectItem>
                <SelectItem value="endurance">Endurance</SelectItem>
                <SelectItem value="general_fitness">General Fitness</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-white/90 font-light">Description</Label>
          <Textarea
            value={planData.description}
            onChange={(e) => setPlanData({ ...planData, description: e.target.value })}
            className="glass border-white/20 text-white mt-1 font-light"
            placeholder="Describe your workout plan..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-white/90 font-light">Duration (weeks)</Label>
            <Input
              type="number"
              value={planData.duration_weeks}
              onChange={(e) => setPlanData({ ...planData, duration_weeks: parseInt(e.target.value) })}
              className="glass border-white/20 text-white mt-1 font-light"
              min="1"
            />
          </div>
          <div>
            <Label className="text-white/90 font-light">Days per week</Label>
            <Input
              type="number"
              value={planData.days_per_week}
              onChange={(e) => setPlanData({ ...planData, days_per_week: parseInt(e.target.value) })}
              className="glass border-white/20 text-white mt-1 font-light"
              min="1"
              max="7"
            />
          </div>
        </div>
      </div>

      {/* Workouts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-light text-white">Workout Sessions</h3>
          <button
            onClick={addWorkout}
            className="glass px-6 py-3 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Workout
          </button>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="workouts" type="workout">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {workouts.map((workout, workoutIndex) => (
                  <Draggable key={workoutIndex} draggableId={`workout-${workoutIndex}`} index={workoutIndex}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="glass-strong rounded-3xl p-6 shadow-2xl space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="w-5 h-5 text-white/50 cursor-move" />
                            </div>
                            <Input
                              value={workout.name}
                              onChange={(e) => updateWorkout(workoutIndex, 'name', e.target.value)}
                              className="glass border-white/20 text-white font-light flex-1"
                              placeholder="Workout name"
                            />
                            <Input
                              value={workout.day}
                              onChange={(e) => updateWorkout(workoutIndex, 'day', e.target.value)}
                              className="glass border-white/20 text-white font-light w-32"
                              placeholder="Day"
                            />
                          </div>
                          <button
                            onClick={() => deleteWorkout(workoutIndex)}
                            className="glass p-2 rounded-xl hover:glass-strong text-red-400 ml-3"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Exercises */}
                        <Droppable droppableId={`workout-${workoutIndex}`} type="exercise">
                          {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                              {workout.exercises.map((exercise, exerciseIndex) => (
                                <Draggable
                                  key={exerciseIndex}
                                  draggableId={`exercise-${workoutIndex}-${exerciseIndex}`}
                                  index={exerciseIndex}
                                >
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className="glass rounded-2xl p-4 space-y-3"
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2 flex-1">
                                          <div {...provided.dragHandleProps}>
                                            <GripVertical className="w-4 h-4 text-white/30 cursor-move" />
                                          </div>
                                          <div className="flex-1">
                                            <p className="text-white font-light">{exercise.custom_name}</p>
                                            {exercise.is_superset && (
                                              <span className="text-xs text-white/50">Superset</span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => updateExerciseInWorkout(workoutIndex, exerciseIndex, 'is_superset', !exercise.is_superset)}
                                            className={`glass px-3 py-1 rounded-lg text-xs ${exercise.is_superset ? 'bg-white/20' : ''}`}
                                          >
                                            SS
                                          </button>
                                          <button
                                            onClick={() => deleteExerciseFromWorkout(workoutIndex, exerciseIndex)}
                                            className="glass p-2 rounded-lg hover:glass-strong text-red-400"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>

                                      {/* Sets */}
                                      <div className="space-y-2">
                                        {exercise.sets_data.map((set, setIndex) => (
                                          <div key={setIndex} className="flex items-center gap-2">
                                            <span className="text-white/70 text-sm w-12">Set {set.set_number}</span>
                                            <Input
                                              value={set.reps}
                                              onChange={(e) => updateSetData(workoutIndex, exerciseIndex, setIndex, 'reps', e.target.value)}
                                              className="glass border-white/20 text-white text-sm font-light w-20"
                                              placeholder="Reps"
                                            />
                                            <Input
                                              type="number"
                                              step="0.5"
                                              value={set.weight}
                                              onChange={(e) => updateSetData(workoutIndex, exerciseIndex, setIndex, 'weight', parseFloat(e.target.value))}
                                              className="glass border-white/20 text-white text-sm font-light w-24"
                                              placeholder="Weight"
                                            />
                                            {setIndex > 0 && (
                                              <button
                                                onClick={() => removeSetFromExercise(workoutIndex, exerciseIndex, setIndex)}
                                                className="text-white/50 hover:text-white"
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </button>
                                            )}
                                          </div>
                                        ))}
                                        <button
                                          onClick={() => addSetToExercise(workoutIndex, exerciseIndex)}
                                          className="text-white/70 text-sm hover:text-white"
                                        >
                                          + Add Set
                                        </button>
                                      </div>

                                      {/* Rest Period */}
                                      <div className="flex items-center gap-2">
                                        <Label className="text-white/70 text-sm">Rest:</Label>
                                        <Input
                                          type="number"
                                          value={exercise.rest_period_seconds}
                                          onChange={(e) => updateExerciseInWorkout(workoutIndex, exerciseIndex, 'rest_period_seconds', parseInt(e.target.value))}
                                          className="glass border-white/20 text-white text-sm font-light w-20"
                                        />
                                        <span className="text-white/70 text-sm">seconds</span>
                                      </div>

                                      {/* Notes */}
                                      <Input
                                        value={exercise.notes_for_exercise || ""}
                                        onChange={(e) => updateExerciseInWorkout(workoutIndex, exerciseIndex, 'notes_for_exercise', e.target.value)}
                                        className="glass border-white/20 text-white text-sm font-light"
                                        placeholder="Exercise notes..."
                                      />
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>

                        <button
                          onClick={() => {
                            setSelectedWorkoutIndex(workoutIndex);
                            setShowExerciseSelector(true);
                          }}
                          className="w-full glass px-4 py-3 rounded-xl text-white font-light hover:glass-strong transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          <Plus className="w-5 h-5" />
                          Add Exercise
                        </button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <ExerciseSelector
        open={showExerciseSelector}
        onClose={() => setShowExerciseSelector(false)}
        onSelect={addExerciseToWorkout}
      />
    </div>
  );
}