import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Sparkles, Play, ChevronDown, ChevronUp } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ExerciseConfigPanel({ exercise, exerciseDetails, programGoal, onUpdate, availableExercises, currentIndex }) {
  const [mode, setMode] = useState('quick'); // 'quick' or 'advanced'
  const [isGenerating, setIsGenerating] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const handleAddSet = () => {
    const lastSet = exercise.sets_data[exercise.sets_data.length - 1] || {};
    const newSet = {
      set_number: exercise.sets_data.length + 1,
      reps: lastSet.reps || '10',
      weight: lastSet.weight || 0,
      rest_seconds: lastSet.rest_seconds || 90,
      tempo: lastSet.tempo || '',
      rpe: null,
      rir: null,
      is_warmup: false,
      is_dropset: false
    };
    
    onUpdate({
      sets_data: [...exercise.sets_data, newSet]
    });
  };

  const handleRemoveSet = (setIndex) => {
    const updated = exercise.sets_data.filter((_, i) => i !== setIndex);
    updated.forEach((set, i) => set.set_number = i + 1);
    onUpdate({ sets_data: updated });
  };

  const handleUpdateSet = (setIndex, field, value) => {
    const updated = [...exercise.sets_data];
    updated[setIndex] = { ...updated[setIndex], [field]: value };
    onUpdate({ sets_data: updated });
  };

  const handleAIGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Given a ${programGoal} program, suggest optimal training parameters for the exercise "${exercise.custom_name}". 
        Return recommendations for sets, reps, rest time (in seconds), tempo, and target RIR (reps in reserve).
        Base recommendations on exercise science and the specific goal.`,
        response_json_schema: {
          type: "object",
          properties: {
            sets: { type: "number" },
            reps: { type: "string" },
            rest_seconds: { type: "number" },
            tempo: { type: "string" },
            rir: { type: "number" }
          }
        }
      });

      // Apply AI recommendations
      const newSets = Array.from({ length: response.sets }, (_, i) => ({
        set_number: i + 1,
        reps: response.reps,
        weight: 0,
        rest_seconds: response.rest_seconds,
        tempo: response.tempo,
        rpe: null,
        rir: response.rir,
        is_warmup: false,
        is_dropset: false
      }));

      onUpdate({ sets_data: newSets });
    } catch (error) {
      console.error('AI generation failed:', error);
      alert('Failed to generate AI recommendations');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Video Preview Section */}
      {exerciseDetails?.video_url && (
        <div className="glass rounded-xl overflow-hidden">
          <button
            onClick={() => setShowVideo(!showVideo)}
            className="w-full p-3 flex items-center justify-between text-white hover:glass-strong transition-all duration-300"
          >
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              <span className="font-light">Exercise Video & Guide</span>
            </div>
            {showVideo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {showVideo && (
            <div className="space-y-3 p-3 pt-0">
              <div className="relative aspect-video rounded-lg overflow-hidden">
                <iframe
                  src={exerciseDetails.video_url}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              
              {exerciseDetails.description && (
                <div className="glass rounded-lg p-3">
                  <p className="text-white/90 text-sm whitespace-pre-line">{exerciseDetails.description}</p>
                </div>
              )}
              
              {exerciseDetails.primary_muscle_group && (
                <div className="flex gap-2 flex-wrap text-xs">
                  <span className="glass px-2 py-1 rounded text-white/70">
                    {exerciseDetails.primary_muscle_group}
                  </span>
                  {exerciseDetails.difficulty_level && (
                    <span className="glass px-2 py-1 rounded text-white/70">
                      {exerciseDetails.difficulty_level}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('quick')}
          className={`flex-1 glass px-4 py-2 rounded-lg font-light transition-all duration-300 ${
            mode === 'quick' ? 'bg-white/10' : ''
          }`}
        >
          Quick Mode
        </button>
        <button
          onClick={() => setMode('advanced')}
          className={`flex-1 glass px-4 py-2 rounded-lg font-light transition-all duration-300 ${
            mode === 'advanced' ? 'bg-white/10' : ''
          }`}
        >
          Advanced Mode
        </button>
        <button
          onClick={handleAIGenerate}
          disabled={isGenerating}
          className="glass px-4 py-2 rounded-lg hover:glass-strong transition-all duration-300 flex items-center gap-2"
          title="AI Auto-Fill"
        >
          <Sparkles className="w-4 h-4" />
          {isGenerating ? '...' : 'AI'}
        </button>
      </div>

      {/* Sets Configuration */}
      <div className="space-y-2">
        <Label className="text-white/90 font-light">Sets</Label>
        {exercise.sets_data.map((set, setIndex) => (
          <div key={setIndex} className="glass rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white/70 text-sm w-16">Set {set.set_number}</span>
              <div className="flex-1 grid grid-cols-3 gap-2">
                <Input
                  type="text"
                  value={set.reps}
                  onChange={(e) => handleUpdateSet(setIndex, 'reps', e.target.value)}
                  className="glass border-white/20 text-white text-sm font-light"
                  placeholder="Reps"
                />
                <Input
                  type="number"
                  value={set.weight}
                  onChange={(e) => handleUpdateSet(setIndex, 'weight', parseFloat(e.target.value))}
                  className="glass border-white/20 text-white text-sm font-light"
                  placeholder="Weight"
                />
                <Input
                  type="number"
                  value={set.rest_seconds}
                  onChange={(e) => handleUpdateSet(setIndex, 'rest_seconds', parseInt(e.target.value))}
                  className="glass border-white/20 text-white text-sm font-light"
                  placeholder="Rest (s)"
                />
              </div>
              {exercise.sets_data.length > 1 && (
                <button
                  onClick={() => handleRemoveSet(setIndex)}
                  className="glass p-2 rounded-lg hover:glass-strong transition-all duration-200 text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {mode === 'advanced' && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                <Input
                  type="text"
                  value={set.tempo || ''}
                  onChange={(e) => handleUpdateSet(setIndex, 'tempo', e.target.value)}
                  className="glass border-white/20 text-white text-xs font-light"
                  placeholder="Tempo"
                />
                <Input
                  type="number"
                  value={set.rpe || ''}
                  onChange={(e) => handleUpdateSet(setIndex, 'rpe', e.target.value ? parseFloat(e.target.value) : null)}
                  className="glass border-white/20 text-white text-xs font-light"
                  placeholder="RPE"
                />
                <Input
                  type="number"
                  value={set.rir ?? ''}
                  onChange={(e) => handleUpdateSet(setIndex, 'rir', e.target.value ? parseInt(e.target.value) : null)}
                  className="glass border-white/20 text-white text-xs font-light"
                  placeholder="RIR"
                />
                <div className="flex gap-1">
                  <button
                    onClick={() => handleUpdateSet(setIndex, 'is_warmup', !set.is_warmup)}
                    className={`flex-1 glass px-2 py-1 rounded text-xs transition-all duration-200 ${
                      set.is_warmup ? 'bg-blue-500/30' : ''
                    }`}
                  >
                    W
                  </button>
                  <button
                    onClick={() => handleUpdateSet(setIndex, 'is_dropset', !set.is_dropset)}
                    className={`flex-1 glass px-2 py-1 rounded text-xs transition-all duration-200 ${
                      set.is_dropset ? 'bg-orange-500/30' : ''
                    }`}
                  >
                    D
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        <button
          onClick={handleAddSet}
          className="w-full glass px-4 py-2 rounded-xl text-white hover:glass-strong transition-all duration-300 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Set
        </button>
      </div>

      {/* Advanced Options */}
      {mode === 'advanced' && (
        <>
          <div>
            <Label className="text-white/90 font-light">Superset With</Label>
            <Select
              value={exercise.superset_with?.toString() || 'none'}
              onValueChange={(value) => onUpdate({ superset_with: value === 'none' ? null : parseInt(value) })}
            >
              <SelectTrigger className="glass border-white/20 text-white mt-1 font-light">
                <SelectValue placeholder="No superset" />
              </SelectTrigger>
              <SelectContent className="glass-strong border-white/20">
                <SelectItem value="none" className="text-white hover:bg-white/10">No Superset</SelectItem>
                {availableExercises.map((ex, idx) => 
                  idx !== currentIndex && (
                    <SelectItem key={idx} value={idx.toString()} className="text-white hover:bg-white/10">
                      {ex.custom_name}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white/90 font-light">Exercise Notes</Label>
            <Textarea
              value={exercise.notes || ''}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              className="glass border-white/20 text-white mt-1 font-light"
              placeholder="Special instructions, form cues, or modifications..."
              rows={2}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={exercise.track_progress}
              onChange={(e) => onUpdate({ track_progress: e.target.checked })}
              className="w-4 h-4"
            />
            <Label className="text-white/90 font-light">Track Progress for This Exercise</Label>
          </div>
        </>
      )}
    </div>
  );
}