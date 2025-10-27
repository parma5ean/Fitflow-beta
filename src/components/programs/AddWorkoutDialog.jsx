
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight } from "lucide-react";

export default function AddWorkoutDialog({ open, onClose, programId, program, weekNumber, dayOfWeek, existingWorkout, workoutsCount }) {
  const queryClient = useQueryClient();
  
  const [workoutData, setWorkoutData] = useState({
    name: "",
    description: "",
    muscle_focus: "full_body"
  });

  useEffect(() => {
    if (existingWorkout) {
      setWorkoutData({
        name: existingWorkout.name,
        description: existingWorkout.description || "",
        muscle_focus: existingWorkout.muscle_focus || "full_body"
      });
    } else {
      setWorkoutData({
        name: "",
        description: "",
        muscle_focus: "full_body"
      });
    }
  }, [existingWorkout, open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        ...workoutData,
        program_id: programId,
        week_number: weekNumber,
        day_of_week: dayOfWeek,
        order_index: existingWorkout?.order_index ?? workoutsCount,
        exercises: existingWorkout?.exercises || []
      };

      if (existingWorkout) {
        return await base44.entities.ProgramWorkout.update(existingWorkout.id, data);
      } else {
        return await base44.entities.ProgramWorkout.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programWorkouts', programId] });
      onClose();
    }
  });

  const handleSave = () => {
    if (!workoutData.name) {
      alert('Please enter a workout name');
      return;
    }
    saveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-strong border-white/20 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light">
            {existingWorkout ? 'Edit Workout' : `Add Workout - Week ${weekNumber}, ${dayOfWeek}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-white/90 font-light">Workout Name *</Label>
            <Input
              value={workoutData.name}
              onChange={(e) => setWorkoutData({ ...workoutData, name: e.target.value })}
              className="glass border-white/20 text-white mt-1 font-light"
              placeholder="e.g., Push A, Leg Day, Core Burn 🔥"
            />
          </div>

          <div>
            <Label className="text-white/90 font-light">Description / Notes</Label>
            <Textarea
              value={workoutData.description}
              onChange={(e) => setWorkoutData({ ...workoutData, description: e.target.value })}
              className="glass border-white/20 text-white mt-1 font-light"
              placeholder="Warm-up guidance, goals, or special instructions..."
              rows={2}
            />
          </div>

          <div>
            <Label className="text-white/90 font-light">Muscle Focus</Label>
            <Select value={workoutData.muscle_focus} onValueChange={(value) => setWorkoutData({ ...workoutData, muscle_focus: value })}>
              <SelectTrigger className="glass border-white/20 text-white mt-1 font-light">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-strong border-white/20">
                <SelectItem value="chest" className="text-white hover:bg-white/10">Chest</SelectItem>
                <SelectItem value="back" className="text-white hover:bg-white/10">Back</SelectItem>
                <SelectItem value="legs" className="text-white hover:bg-white/10">Legs</SelectItem>
                <SelectItem value="shoulders" className="text-white hover:bg-white/10">Shoulders</SelectItem>
                <SelectItem value="arms" className="text-white hover:bg-white/10">Arms</SelectItem>
                <SelectItem value="core" className="text-white hover:bg-white/10">Core</SelectItem>
                <SelectItem value="full_body" className="text-white hover:bg-white/10">Full Body</SelectItem>
                <SelectItem value="cardio" className="text-white hover:bg-white/10">Cardio</SelectItem>
                <SelectItem value="mobility" className="text-white hover:bg-white/10">Mobility</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 glass px-6 py-3 rounded-xl text-white/70 font-light hover:glass-strong transition-all duration-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="flex-1 glass px-6 py-3 rounded-xl text-white font-light hover:glass-strong transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saveMutation.isPending ? 'Saving...' : existingWorkout ? 'Save Changes' : (
                <>Save & Add Exercises <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
