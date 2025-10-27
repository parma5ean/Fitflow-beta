import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

export default function MacroGoalsDialog({ open, onClose, currentGoals }) {
  const [goals, setGoals] = useState({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fats: 60
  });

  useEffect(() => {
    if (currentGoals) {
      setGoals(currentGoals);
    }
  }, [currentGoals]);

  const saveMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe({ macro_goals: data }),
    onSuccess: () => {
      onClose();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(goals);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-strong border-white/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light flex items-center justify-between">
            Set Macro Goals
            <button onClick={onClose} className="glass p-2 rounded-xl hover:glass-strong">
              <X className="w-5 h-5" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-white/90 font-light">Daily Calories</Label>
            <Input
              type="number"
              value={goals.calories}
              onChange={(e) => setGoals({ ...goals, calories: parseInt(e.target.value) })}
              className="glass border-white/20 text-white mt-1 font-light"
            />
          </div>

          <div>
            <Label className="text-white/90 font-light">Protein (grams)</Label>
            <Input
              type="number"
              value={goals.protein}
              onChange={(e) => setGoals({ ...goals, protein: parseInt(e.target.value) })}
              className="glass border-white/20 text-white mt-1 font-light"
            />
          </div>

          <div>
            <Label className="text-white/90 font-light">Carbs (grams)</Label>
            <Input
              type="number"
              value={goals.carbs}
              onChange={(e) => setGoals({ ...goals, carbs: parseInt(e.target.value) })}
              className="glass border-white/20 text-white mt-1 font-light"
            />
          </div>

          <div>
            <Label className="text-white/90 font-light">Fats (grams)</Label>
            <Input
              type="number"
              value={goals.fats}
              onChange={(e) => setGoals({ ...goals, fats: parseInt(e.target.value) })}
              className="glass border-white/20 text-white mt-1 font-light"
            />
          </div>

          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="w-full glass px-6 py-3 rounded-xl text-white font-light hover:glass-strong transition-all duration-300 disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Goals'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}