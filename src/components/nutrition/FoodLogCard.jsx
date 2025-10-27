import React from "react";
import { Apple, Drumstick, Sandwich, Cookie } from "lucide-react";

const mealIcons = {
  breakfast: Sandwich,
  lunch: Drumstick,
  dinner: Apple,
  snack: Cookie
};

export default function FoodLogCard({ food }) {
  const Icon = mealIcons[food.meal_type] || Apple;

  return (
    <div className="glass rounded-2xl p-4 hover:glass-strong transition-all duration-300">
      <div className="flex items-start gap-4">
        <Icon className="w-6 h-6 text-white/70 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="text-white font-light">{food.food_name}</h4>
              {food.serving_size && (
                <p className="text-white/70 text-sm">{food.serving_size}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-white font-light">{food.calories} kcal</p>
            </div>
          </div>
          <div className="flex gap-4 text-sm">
            {food.protein > 0 && (
              <span className="text-white/70">P: {food.protein}g</span>
            )}
            {food.carbs > 0 && (
              <span className="text-white/70">C: {food.carbs}g</span>
            )}
            {food.fats > 0 && (
              <span className="text-white/70">F: {food.fats}g</span>
            )}
          </div>
          {food.notes && (
            <p className="text-white/60 text-sm mt-2">{food.notes}</p>
          )}
        </div>
      </div>
    </div>
  );
}