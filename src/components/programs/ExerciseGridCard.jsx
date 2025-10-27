import React from "react";
import { GripVertical, Copy, Trash2, Edit, Dumbbell, Play } from "lucide-react";

export default function ExerciseGridCard({ exercise, exerciseDetails, index, dragHandleProps, onEdit, onDuplicate, onDelete }) {
  return (
    <div className="glass-strong rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
      {/* Video Thumbnail */}
      {exerciseDetails?.video_url && (
        <div className="relative aspect-video bg-black/20">
          <iframe
            src={exerciseDetails.video_url}
            className="w-full h-full pointer-events-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
            <Play className="w-6 h-6 text-white/80" />
          </div>
        </div>
      )}
      
      {/* No Video Placeholder */}
      {!exerciseDetails?.video_url && (
        <div className="aspect-video bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
          <Dumbbell className="w-12 h-12 text-white/30" />
        </div>
      )}

      {/* Card Content */}
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-2">
          <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing mt-1">
            <GripVertical className="w-4 h-4 text-white/50" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-light text-base line-clamp-2">{exercise.custom_name}</h3>
            <p className="text-white/60 text-xs mt-1">
              {exercise.sets_data.length} sets
              {exercise.superset_with !== null && ' • Superset'}
            </p>
          </div>
        </div>

        {/* Exercise Details */}
        {exerciseDetails && (
          <div className="flex gap-2 flex-wrap text-xs">
            {exerciseDetails.primary_muscle_group && (
              <span className="glass px-2 py-1 rounded text-white/70">
                {exerciseDetails.primary_muscle_group}
              </span>
            )}
            {exerciseDetails.difficulty_level && (
              <span className="glass px-2 py-1 rounded text-white/70">
                {exerciseDetails.difficulty_level}
              </span>
            )}
          </div>
        )}

        {/* Sets Preview */}
        <div className="glass rounded-lg p-2 space-y-1">
          {exercise.sets_data.slice(0, 3).map((set, idx) => (
            <div key={idx} className="flex justify-between text-xs text-white/70">
              <span>Set {set.set_number}</span>
              <span>{set.reps} reps @ {set.weight}kg</span>
            </div>
          ))}
          {exercise.sets_data.length > 3 && (
            <p className="text-xs text-white/50 text-center">+{exercise.sets_data.length - 3} more</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 glass px-3 py-2 rounded-lg hover:glass-strong transition-all duration-200 flex items-center justify-center gap-2 text-white text-sm"
          >
            <Edit className="w-3 h-3" />
            Edit
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
    </div>
  );
}