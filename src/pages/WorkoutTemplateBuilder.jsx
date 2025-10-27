import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Save, Plus, Trash2, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPageUrl } from "@/utils";
import ExerciseSelector from "../components/workouts/ExerciseSelector";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function WorkoutTemplateBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const templateId = new URLSearchParams(location.search).get('templateId');

  const [templateData, setTemplateData] = useState({
    name: "",
    description: "",
    exercises: [],
    duration_minutes: null,
    is_template: true
  });

  const [showExerciseSelector, setShowExerciseSelector] = useState(false);

  const { data: existingTemplate } = useQuery({
    queryKey: ['workoutTemplate', templateId],
    queryFn: async () => {
      if (!templateId) return null;
      const templates = await base44.entities.Workout.filter({ id: templateId });
      return templates[0] || null;
    },
    enabled: !!templateId
  });

  useEffect(() => {
    if (existingTemplate) {
      setTemplateData(existingTemplate);
    }
  }, [existingTemplate]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (templateId) {
        await base44.entities.Workout.update(templateId, templateData);
      } else {
        await base44.entities.Workout.create(templateData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutTemplates'] });
      navigate(createPageUrl('WorkoutTemplates'));
    }
  });

  const addExercise = (exercise) => {
    const newExercise = {
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
    };

    setTemplateData({
      ...templateData,
      exercises: [...templateData.exercises, newExercise]
    });
    setShowExerciseSelector(false);
  };

  const updateExercise = (exerciseIndex, field, value) => {
    const updated = { ...templateData };
    updated.exercises[exerciseIndex] = {
      ...updated.exercises[exerciseIndex],
      [field]: value
    };
    setTemplateData(updated);
  };

  const deleteExercise = (exerciseIndex) => {
    setTemplateData({
      ...templateData,
      exercises: templateData.exercises.filter((_, i) => i !== exerciseIndex)
    });
  };

  const updateSetData = (exerciseIndex, setIndex, field, value) => {
    const updated = { ...templateData };
    updated.exercises[exerciseIndex].sets_data[setIndex] = {
      ...updated.exercises[exerciseIndex].sets_data[setIndex],
      [field]: value
    };
    setTemplateData(updated);
  };

  const addSet = (exerciseIndex) => {
    const updated = { ...templateData };
    const setsData = updated.exercises[exerciseIndex].sets_data;
    const lastSet = setsData[setsData.length - 1];
    setsData.push({
      set_number: setsData.length + 1,
      reps: lastSet?.reps || "10",
      weight: lastSet?.weight || 0,
      completed: false
    });
    setTemplateData(updated);
  };

  const removeSet = (exerciseIndex, setIndex) => {
    const updated = { ...templateData };
    updated.exercises[exerciseIndex].sets_data = 
      updated.exercises[exerciseIndex].sets_data.filter((_, i) => i !== setIndex);
    setTemplateData(updated);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const exercises = Array.from(templateData.exercises);
    const [removed] = exercises.splice(result.source.index, 1);
    exercises.splice(result.destination.index, 0, removed);

    setTemplateData({ ...templateData, exercises });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="glass-strong rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(createPageUrl('WorkoutTemplates'))}
            className="glass p-2 rounded-xl hover:glass-strong transition-all duration-300"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-3xl font-light text-white">
            {templateId ? 'Edit Template' : 'Create Workout Template'}
          </h1>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !templateData.name}
            className="glass px-6 py-3 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Template Details */}
      <div className="glass-strong rounded-3xl p-6 shadow-2xl space-y-4">
        <h3 className="text-xl font-light text-white mb-4">Template Details</h3>
        
        <div>
          <Label className="text-white/90 font-light">Template Name</Label>
          <Input
            value={templateData.name}
            onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
            className="glass border-white/20 text-white mt-1 font-light"
            placeholder="e.g., Upper Body Push"
          />
        </div>

        <div>
          <Label className="text-white/90 font-light">Description</Label>
          <Textarea
            value={templateData.description}
            onChange={(e) => setTemplateData({ ...templateData, description: e.target.value })}
            className="glass border-white/20 text-white mt-1 font-light"
            placeholder="Describe this workout template..."
            rows={2}
          />
        </div>

        <div>
          <Label className="text-white/90 font-light">Estimated Duration (minutes)</Label>
          <Input
            type="number"
            value={templateData.duration_minutes || ""}
            onChange={(e) => setTemplateData({ ...templateData, duration_minutes: parseInt(e.target.value) || null })}
            className="glass border-white/20 text-white mt-1 font-light"
            placeholder="60"
          />
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-light text-white">Exercises</h3>
          <button
            onClick={() => setShowExerciseSelector(true)}
            className="glass px-6 py-3 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Exercise
          </button>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="exercises">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {templateData.exercises.map((exercise, exerciseIndex) => (
                  <Draggable key={exerciseIndex} draggableId={`exercise-${exerciseIndex}`} index={exerciseIndex}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="glass-strong rounded-3xl p-6 shadow-2xl space-y-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="w-5 h-5 text-white/50 cursor-move" />
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-light text-lg">{exercise.custom_name}</p>
                              {exercise.is_superset && (
                                <span className="text-xs text-white/50">Superset</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateExercise(exerciseIndex, 'is_superset', !exercise.is_superset)}
                              className={`glass px-3 py-1 rounded-lg text-xs ${exercise.is_superset ? 'bg-white/20' : ''}`}
                            >
                              SS
                            </button>
                            <button
                              onClick={() => deleteExercise(exerciseIndex)}
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
                                onChange={(e) => updateSetData(exerciseIndex, setIndex, 'reps', e.target.value)}
                                className="glass border-white/20 text-white text-sm font-light w-20"
                                placeholder="Reps"
                              />
                              <span className="text-white/70 text-sm">×</span>
                              <Input
                                type="number"
                                step="0.5"
                                value={set.weight}
                                onChange={(e) => updateSetData(exerciseIndex, setIndex, 'weight', parseFloat(e.target.value))}
                                className="glass border-white/20 text-white text-sm font-light w-24"
                                placeholder="Weight"
                              />
                              <span className="text-white/70 text-sm">kg</span>
                              {setIndex > 0 && (
                                <button
                                  onClick={() => removeSet(exerciseIndex, setIndex)}
                                  className="text-white/50 hover:text-white"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            onClick={() => addSet(exerciseIndex)}
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
                            onChange={(e) => updateExercise(exerciseIndex, 'rest_period_seconds', parseInt(e.target.value))}
                            className="glass border-white/20 text-white text-sm font-light w-20"
                          />
                          <span className="text-white/70 text-sm">seconds</span>
                        </div>

                        {/* Notes */}
                        <Input
                          value={exercise.notes_for_exercise || ""}
                          onChange={(e) => updateExercise(exerciseIndex, 'notes_for_exercise', e.target.value)}
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
        </DragDropContext>

        {templateData.exercises.length === 0 && (
          <div className="glass-strong rounded-3xl p-12 text-center shadow-2xl">
            <p className="text-white/70 mb-4">No exercises added yet</p>
            <button
              onClick={() => setShowExerciseSelector(true)}
              className="glass px-6 py-3 rounded-xl text-white hover:glass-strong transition-all duration-300"
            >
              <Plus className="w-5 h-5 inline mr-2" />
              Add Your First Exercise
            </button>
          </div>
        )}
      </div>

      <ExerciseSelector
        open={showExerciseSelector}
        onClose={() => setShowExerciseSelector(false)}
        onSelect={addExercise}
      />
    </div>
  );
}