import React from "react";
import { Dumbbell, Clock, TrendingUp, Target } from "lucide-react";

export default function PlanSummaryPanel({ scheduledWorkouts, planData }) {
  // Calculate metrics
  const totalWorkouts = scheduledWorkouts.length;
  const workoutsPerWeek = totalWorkouts / (planData.duration_weeks || 1);
  
  const avgDuration = scheduledWorkouts.reduce((sum, w) => sum + (w.duration_minutes || 45), 0) / (totalWorkouts || 1);
  
  const totalExercises = scheduledWorkouts.reduce((sum, w) => {
    if (w.sections) {
      return sum + w.sections.reduce((sSum, section) => sSum + (section.exercises?.length || 0), 0);
    }
    return sum + (w.exercises?.length || 0);
  }, 0);

  // Extract muscle groups (simplified)
  const muscleGroups = new Set();
  scheduledWorkouts.forEach(w => {
    const name = w.name.toLowerCase();
    if (name.includes('push') || name.includes('chest')) muscleGroups.add('Chest');
    if (name.includes('pull') || name.includes('back')) muscleGroups.add('Back');
    if (name.includes('leg')) muscleGroups.add('Legs');
    if (name.includes('shoulder')) muscleGroups.add('Shoulders');
    if (name.includes('arm')) muscleGroups.add('Arms');
    if (name.includes('full')) {
      muscleGroups.add('Chest');
      muscleGroups.add('Back');
      muscleGroups.add('Legs');
    }
  });

  const stats = [
    {
      label: "Workouts/Week",
      value: workoutsPerWeek.toFixed(1),
      icon: Dumbbell,
      color: "text-blue-400"
    },
    {
      label: "Avg Duration",
      value: `${Math.round(avgDuration)} min`,
      icon: Clock,
      color: "text-green-400"
    },
    {
      label: "Total Exercises",
      value: totalExercises,
      icon: TrendingUp,
      color: "text-purple-400"
    },
    {
      label: "Muscle Groups",
      value: muscleGroups.size,
      icon: Target,
      color: "text-orange-400"
    }
  ];

  return (
    <div className="glass-strong rounded-3xl p-6 shadow-2xl">
      <h3 className="text-xl font-light text-white mb-4">Plan Summary</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <p className="text-white/70 text-xs">{stat.label}</p>
            </div>
            <p className="text-white text-2xl font-light">{stat.value}</p>
          </div>
        ))}
      </div>

      {muscleGroups.size > 0 && (
        <div className="mt-4 glass rounded-xl p-4">
          <p className="text-white/70 text-sm mb-2">Targeted Muscle Groups:</p>
          <div className="flex flex-wrap gap-2">
            {Array.from(muscleGroups).map((muscle, i) => (
              <span key={i} className="glass px-3 py-1 rounded-lg text-white/90 text-xs">
                {muscle}
              </span>
            ))}
          </div>
        </div>
      )}

      {scheduledWorkouts.length === 0 && (
        <p className="text-white/50 text-center py-4 text-sm">
          Add workouts to see plan summary
        </p>
      )}
    </div>
  );
}