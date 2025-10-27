import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Utensils, Plus, Target } from "lucide-react";
import { format } from "date-fns";
import MacroGoalsDialog from "../components/nutrition/MacroGoalsDialog";
import LogFoodDialog from "../components/nutrition/LogFoodDialog";
import FoodLogCard from "../components/nutrition/FoodLogCard";
import MacroRings from "../components/nutrition/MacroRings";

export default function Nutrition() {
  const [showMacroDialog, setShowMacroDialog] = useState(false);
  const [showFoodDialog, setShowFoodDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const { data: foodLogs } = useQuery({
    queryKey: ['foodLogs', selectedDate],
    queryFn: () => base44.entities.FoodLog.filter({ date: selectedDate }),
    initialData: []
  });

  const totals = {
    calories: foodLogs.reduce((sum, food) => sum + (food.calories || 0), 0),
    protein: foodLogs.reduce((sum, food) => sum + (food.protein || 0), 0),
    carbs: foodLogs.reduce((sum, food) => sum + (food.carbs || 0), 0),
    fats: foodLogs.reduce((sum, food) => sum + (food.fats || 0), 0)
  };

  const goals = user?.macro_goals || { calories: 2000, protein: 150, carbs: 200, fats: 60 };

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="glass-strong rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Utensils className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-3xl md:text-4xl font-light text-white">Nutrition</h1>
              <p className="text-white/70">Track your daily food intake</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowMacroDialog(true)}
              className="glass px-6 py-3 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300"
            >
              <Target className="w-5 h-5 inline mr-2" />
              Set Goals
            </button>
            <button
              onClick={() => setShowFoodDialog(true)}
              className="glass px-6 py-3 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300 shadow-lg"
            >
              <Plus className="w-5 h-5 inline mr-2" />
              Log Food
            </button>
          </div>
        </div>
      </div>

      <div className="glass-strong rounded-2xl p-4 shadow-xl">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="glass border-white/20 text-white px-4 py-2 rounded-xl"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <MacroRings totals={totals} goals={goals} />
        </div>

        <div className="lg:col-span-2 space-y-6">
          {mealTypes.map((mealType) => {
            const mealFoods = foodLogs.filter(f => f.meal_type === mealType);
            return (
              <div key={mealType} className="glass-strong rounded-3xl p-6 shadow-2xl">
                <h3 className="text-xl font-light text-white capitalize mb-4">{mealType}</h3>
                {mealFoods.length > 0 ? (
                  <div className="space-y-3">
                    {mealFoods.map((food) => (
                      <FoodLogCard key={food.id} food={food} />
                    ))}
                  </div>
                ) : (
                  <p className="text-white/50 text-center py-4">No foods logged</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <MacroGoalsDialog 
        open={showMacroDialog}
        onClose={() => setShowMacroDialog(false)}
        currentGoals={user?.macro_goals}
      />

      <LogFoodDialog
        open={showFoodDialog}
        onClose={() => setShowFoodDialog(false)}
        selectedDate={selectedDate}
      />
    </div>
  );
}