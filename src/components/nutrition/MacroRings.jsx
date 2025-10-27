import React from "react";
import { Flame } from "lucide-react";

export default function MacroRings({ totals, goals }) {
  const macros = [
    {
      name: "Calories",
      current: totals.calories,
      goal: goals.calories
    },
    {
      name: "Protein",
      current: totals.protein,
      goal: goals.protein
    },
    {
      name: "Carbs",
      current: totals.carbs,
      goal: goals.carbs
    },
    {
      name: "Fats",
      current: totals.fats,
      goal: goals.fats
    }
  ];

  const caloriePercentage = Math.min((totals.calories / goals.calories) * 100, 100);

  return (
    <div className="glass-strong rounded-3xl p-6 shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Flame className="w-6 h-6 text-white" />
        <h3 className="text-2xl font-light text-white">Daily Macros</h3>
      </div>

      <div className="flex justify-center mb-8">
        <div className="relative">
          <svg width="200" height="200" className="transform -rotate-90">
            <circle
              cx="100"
              cy="100"
              r="80"
              className="stroke-white/10"
              strokeWidth="20"
              fill="none"
            />
            <circle
              cx="100"
              cy="100"
              r="80"
              className="stroke-white"
              strokeWidth="20"
              fill="none"
              strokeDasharray={`${(caloriePercentage / 100) * 502.4} 502.4`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-3xl font-light text-white">{totals.calories.toFixed(0)}</p>
            <p className="text-white/70 text-sm">/ {goals.calories} kcal</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {macros.slice(1).map((macro) => {
          const percentage = Math.min((macro.current / macro.goal) * 100, 100);
          return (
            <div key={macro.name}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-light">{macro.name}</span>
                <span className="text-white/70 text-sm">
                  {macro.current.toFixed(0)}g / {macro.goal}g
                </span>
              </div>
              <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/70 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}