import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Dumbbell, Clock, Play, Plus } from "lucide-react";
import { format } from "date-fns";

export default function TodayWorkout({ todayWorkouts }) {
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');

  // Fetch active program from Program entity
  const { data: activeProgram } = useQuery({
    queryKey: ['activeProgram'],
    queryFn: async () => {
      const programs = await base44.entities.Program.filter({ is_active: true });
      return programs[0] || null;
    }
  });
  
  // Filter for scheduled workouts for today that aren't completed
  const scheduledForToday = todayWorkouts.filter(w => 
    w.scheduled_date === today && !w.is_completed && !w.is_template
  );

  return (
    <div className="glass-strong rounded-3xl p-6 md:p-8 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Dumbbell className="w-6 h-6 text-white" />
          <div>
            <h2 className="text-2xl font-light text-white">Today's Workout</h2>
            {activeProgram && (
              <p className="text-white/70 text-sm">{activeProgram.name}</p>
            )}
          </div>
        </div>
        <Link to={createPageUrl("Programs")}>
          <button className="glass px-4 py-2 rounded-xl text-white hover:glass-strong transition-all duration-300">
            <Plus className="w-5 h-5" />
          </button>
        </Link>
      </div>

      {scheduledForToday.length > 0 ? (
        <div className="space-y-4">
          {scheduledForToday.map((workout) => {
            const exerciseCount = workout.sections?.[0]?.exercises?.length || workout.exercises?.length || 0;
            
            return (
              <div key={workout.id} className="glass rounded-2xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-white font-light text-lg">{workout.name}</h3>
                    {workout.duration_minutes && (
                      <div className="flex items-center gap-2 text-white/70 text-sm mt-1">
                        <Clock className="w-4 h-4" />
                        {workout.duration_minutes} minutes
                      </div>
                    )}
                    {exerciseCount > 0 && (
                      <p className="text-white/50 text-sm mt-1">
                        {exerciseCount} exercises
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => navigate(createPageUrl('WorkoutSession') + `?workoutId=${workout.id}`)}
                    className="glass px-6 py-3 rounded-xl text-white hover:glass-strong transition-all duration-300 flex items-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Start
                  </button>
                </div>
                
                {exerciseCount > 0 && (
                  <div className="space-y-2 mt-4">
                    {(workout.sections?.[0]?.exercises || workout.exercises || []).slice(0, 3).map((exercise, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-white/90">{exercise.custom_name}</span>
                        <span className="text-white/70">
                          {exercise.sets_data?.length || 0} sets
                        </span>
                      </div>
                    ))}
                    {exerciseCount > 3 && (
                      <p className="text-white/50 text-xs">+{exerciseCount - 3} more exercises</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Dumbbell className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <p className="text-white/70 mb-4">No workouts scheduled for today</p>
          <Link to={createPageUrl("Programs")}>
            <button className="glass px-6 py-3 rounded-xl text-white hover:glass-strong transition-all duration-300">
              View Programs
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}