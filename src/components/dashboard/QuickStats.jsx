import React from "react";
import { Flame, Dumbbell, TrendingUp, Target } from "lucide-react";
import { formatWeight } from "@/components/utils/unitConversion";
import { subDays, format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function QuickStats({ user, todayWorkouts, recentProgress }) {
  const unitSystem = user?.unit_system || "metric";
  const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');

  // Fetch completed workouts from the last 7 days
  const { data: weeklyCompletedWorkouts } = useQuery({
    queryKey: ['weeklyCompletedWorkouts', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const workouts = await base44.entities.Workout.filter({
        is_completed: true,
        created_by: user.email
      });
      return workouts.filter(w => w.completed_date && w.completed_date >= sevenDaysAgo);
    },
    enabled: !!user,
    initialData: []
  });
  
  const stats = [
    {
      label: "Current Weight",
      value: user?.current_weight ? formatWeight(user.current_weight, unitSystem) : "Not set",
      icon: Target
    },
    {
      label: "Goal Weight",
      value: user?.goal_weight ? formatWeight(user.goal_weight, unitSystem) : "Not set",
      icon: TrendingUp
    },
    {
      label: "This Week",
      value: `${weeklyCompletedWorkouts.length} workouts`,
      icon: Dumbbell
    },
    {
      label: "Progress Logs",
      value: recentProgress.length > 0 ? `${recentProgress.length} entries` : "No data",
      icon: Flame
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="glass rounded-2xl p-6 shadow-xl hover:glass-strong transition-all duration-300">
          <stat.icon className="w-6 h-6 text-white/70 mb-4" />
          <p className="text-white/70 text-sm mb-1 font-light">{stat.label}</p>
          <p className="text-white text-2xl font-light">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}