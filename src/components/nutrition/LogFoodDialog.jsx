import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

export default function LogFoodDialog({ open, onClose, selectedDate }) {
  const [formData, setFormData] = useState({
    food_name: "",
    meal_type: "breakfast",
    serving_size: "",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
    notes: ""
  });
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.FoodLog.create({
      ...data,
      date: selectedDate,
      calories: parseFloat(data.calories) || 0,
      protein: parseFloat(data.protein) || 0,
      carbs: parseFloat(data.carbs) || 0,
      fats: parseFloat(data.fats) || 0
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foodLogs'] });
      queryClient.invalidateQueries({ queryKey: ['todayFood'] });
      onClose();
      setFormData({
        food_name: "",
        meal_type: "breakfast",
        serving_size: "",
        calories: "",
        protein: "",
        carbs: "",
        fats: "",
        notes: ""
      });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-strong border-white/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light flex items-center justify-between">
            Log Food
            <button onClick={onClose} className="glass p-2 rounded-xl hover:glass-strong">
              <X className="w-5 h-5" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-white/90 font-light">Food Name</Label>
            <Input
              value={formData.food_name}
              onChange={(e) => setFormData({ ...formData, food_name: e.target.value })}
              className="glass border-white/20 text-white placeholder:text-white/50 mt-1 font-light"
              placeholder="Grilled Chicken Breast"
              required
            />
          </div>

          <div>
            <Label className="text-white/90 font-light">Meal</Label>
            <Select
              value={formData.meal_type}
              onValueChange={(value) => setFormData({ ...formData, meal_type: value })}
            >
              <SelectTrigger className="glass border-white/20 text-white mt-1 font-light">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-strong border-white/20">
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
                <SelectItem value="snack">Snack</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white/90 font-light">Serving Size</Label>
            <Input
              value={formData.serving_size}
              onChange={(e) => setFormData({ ...formData, serving_size: e.target.value })}
              className="glass border-white/20 text-white placeholder:text-white/50 mt-1 font-light"
              placeholder="200g"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white/90 font-light">Calories</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.calories}
                onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                className="glass border-white/20 text-white mt-1 font-light"
                required
              />
            </div>
            <div>
              <Label className="text-white/90 font-light">Protein (g)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.protein}
                onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                className="glass border-white/20 text-white mt-1 font-light"
              />
            </div>
            <div>
              <Label className="text-white/90 font-light">Carbs (g)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.carbs}
                onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                className="glass border-white/20 text-white mt-1 font-light"
              />
            </div>
            <div>
              <Label className="text-white/90 font-light">Fats (g)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.fats}
                onChange={(e) => setFormData({ ...formData, fats: e.target.value })}
                className="glass border-white/20 text-white mt-1 font-light"
              />
            </div>
          </div>

          <div>
            <Label className="text-white/90 font-light">Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="glass border-white/20 text-white placeholder:text-white/50 mt-1 font-light"
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>

          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="w-full glass px-6 py-3 rounded-xl text-white font-light hover:glass-strong transition-all duration-300 disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving...' : 'Log Food'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}