import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Utensils, Plus } from "lucide-react";

export default function MacroOverview({ user, todayCalories, todayProtein, todayCarbs, todayFats }) {
  const macros = user?.macro_goals || { calories: 2000, protein: 150, carbs: 200, fats: 60 };

  const macroData = [
    {
      name: "Calories",
      current: todayCalories,
      goal: macros.calories,
      unit: "kcal"
    },
    {
      name: "Protein",
      current: todayProtein,
      goal: macros.protein,
      unit: "g"
    },
    {
      name: "Carbs",
      current: todayCarbs,
      goal: macros.carbs,
      unit: "g"
    },
    {
      name: "Fats",
      current: todayFats,
      goal: macros.fats,
      unit: "g"
    }
  ];

  return (
    <div className="glass-strong rounded-3xl p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Utensils className="w-6 h-6 text-white" />
          <h2 className="text-2xl font-light text-white">Today's Nutrition</h2>
        </div>
        <Link to={createPageUrl("Nutrition")}>
          <button className="glass px-4 py-2 rounded-xl text-white hover:glass-strong transition-all duration-300">
            <Plus className="w-5 h-5" />
          </button>
        </Link>
      </div>

      <div className="space-y-6">
        {macroData.map((macro) => {
          const percentage = Math.min((macro.current / macro.goal) * 100, 100);
          return (
            <div key={macro.name}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-light">{macro.name}</span>
                <span className="text-white/70 text-sm font-light">
                  {macro.current.toFixed(0)} / {macro.goal} {macro.unit}
                </span>
              </div>
              <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/70 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <Link to={createPageUrl("Nutrition")}>
        <button className="w-full mt-6 glass px-6 py-3 rounded-xl text-white hover:glass-strong transition-all duration-300 font-light">
          View Full Nutrition Log
        </button>
      </Link>
    </div>
  );
}