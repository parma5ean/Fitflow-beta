import React from "react";
import { Calendar, TrendingUp, Play, Star, Edit } from "lucide-react";

export default function WorkoutPlanCard({ plan, workouts, onSetActive, onEdit, onStartWorkout }) {
  const scheduledWorkouts = workouts.filter(w => !w.is_template);
  const completedWorkouts = scheduledWorkouts.filter(w => w.is_completed);
  
  return (
    <div className="glass-strong rounded-3xl p-6 shadow-2xl hover:scale-105 transition-all duration-300">
      {plan.is_active && (
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-white fill-white" />
          <span className="text-white text-sm font-light">Active Plan</span>
        </div>
      )}
      
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-light text-white mb-2">{plan.name}</h3>
          <button
            onClick={onEdit}
            className="glass p-2 rounded-xl hover:glass-strong transition-all duration-300"
          >
            <Edit className="w-4 h-4 text-white" />
          </button>
        </div>
        {plan.description && (
          <p className="text-white/70 text-sm line-clamp-2">{plan.description}</p>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-white/80">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm capitalize">{plan.goal?.replace('_', ' ')}</span>
        </div>
        {plan.duration_weeks && (
          <div className="flex items-center gap-2 text-white/80">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{plan.duration_weeks} weeks</span>
          </div>
        )}
        <div className="text-white/80 text-sm">
          {completedWorkouts.length} / {scheduledWorkouts.length} workouts completed
        </div>
        {plan.is_ai_generated && (
          <div className="text-white/60 text-xs flex items-center gap-1">
            <span>✨ AI Generated</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onStartWorkout}
          className="flex-1 glass px-4 py-3 rounded-xl text-white font-light hover:glass-strong transition-all duration-300 flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" />
          Log Session
        </button>
        {!plan.is_active && (
          <button
            onClick={onSetActive}
            className="glass px-4 py-3 rounded-xl text-white hover:glass-strong transition-all duration-300"
          >
            Set Active
          </button>
        )}
      </div>
    </div>
  );
}