import React from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Copy, Trash2, Dumbbell, Settings } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function ProgramWorkoutCard({ workout, onEdit, onDelete, onDuplicate, programId, compact = false }) {
  const navigate = useNavigate();
  const exerciseCount = workout.exercises?.length || 0;
  const totalSets = workout.exercises?.reduce((sum, ex) => sum + (ex.sets_data?.length || 0), 0) || 0;

  if (compact) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h4 className="text-white text-sm font-light mb-1 line-clamp-2">{workout.name}</h4>
            <p className="text-white/60 text-xs">{exerciseCount} ex • {totalSets} sets</p>
          </div>
          
          <div className="flex gap-1 mt-2">
            <button
              onClick={() => navigate(createPageUrl('ProgramWorkoutBuilder') + `?programId=${programId}&workoutId=${workout.id}`)}
              className="flex-1 glass p-1 rounded text-white/70 hover:text-white hover:glass-strong transition-all duration-200"
              title="Configure"
            >
              <Settings className="w-3 h-3 mx-auto" />
            </button>
            <button
              onClick={onEdit}
              className="flex-1 glass p-1 rounded text-white/70 hover:text-white hover:glass-strong transition-all duration-200"
              title="Edit"
            >
              <Edit className="w-3 h-3 mx-auto" />
            </button>
            <button
              onClick={onDelete}
              className="flex-1 glass p-1 rounded text-red-400 hover:text-red-300 hover:glass-strong transition-all duration-200"
              title="Delete"
            >
              <Trash2 className="w-3 h-3 mx-auto" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-4 hover:glass-strong transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-white font-light text-lg mb-1">{workout.name}</h3>
          {workout.muscle_focus && (
            <span className="inline-block text-white/60 text-xs capitalize">
              {workout.muscle_focus}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => navigate(createPageUrl('ProgramWorkoutBuilder') + `?programId=${programId}&workoutId=${workout.id}`)}
            className="glass p-2 rounded-lg hover:glass-strong transition-all duration-200"
            title="Configure Exercises"
          >
            <Settings className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={onEdit}
            className="glass p-2 rounded-lg hover:glass-strong transition-all duration-200"
            title="Edit Details"
          >
            <Edit className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={onDuplicate}
            className="glass p-2 rounded-lg hover:glass-strong transition-all duration-200"
            title="Duplicate"
          >
            <Copy className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={onDelete}
            className="glass p-2 rounded-lg hover:glass-strong transition-all duration-200 text-red-400"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {workout.description && (
        <p className="text-white/70 text-sm mb-3 line-clamp-2">{workout.description}</p>
      )}

      <div className="flex items-center gap-4 text-white/60 text-sm">
        <div className="flex items-center gap-1">
          <Dumbbell className="w-4 h-4" />
          <span>{exerciseCount} exercises</span>
        </div>
        <div className="flex items-center gap-1">
          <span>{totalSets} sets</span>
        </div>
      </div>
    </div>
  );
}