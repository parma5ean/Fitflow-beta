import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Dumbbell } from "lucide-react";
import { format } from "date-fns";

export default function StartProgramDialog({ open, onClose, program, workouts, onConfirm }) {
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startDayOfWeek, setStartDayOfWeek] = useState('monday');

  const daysOfWeek = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];

  const handleConfirm = () => {
    if (!startDate || !startDayOfWeek) {
      alert('Please select a start date and starting day');
      return;
    }
    onConfirm(startDate, startDayOfWeek);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-strong border-white/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light">Start Program</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-white/70 text-sm">
            Choose when you want to start {program?.name} and which day of the week your program begins.
          </p>

          <div>
            <Label className="text-white/90 font-light flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4" />
              Start Date
            </Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="glass border-white/20 text-white font-light"
            />
          </div>

          <div>
            <Label className="text-white/90 font-light flex items-center gap-2 mb-2">
              <Dumbbell className="w-4 h-4" />
              Program Starts On
            </Label>
            <Select value={startDayOfWeek} onValueChange={setStartDayOfWeek}>
              <SelectTrigger className="glass border-white/20 text-white font-light">
                <SelectValue placeholder="Select starting day..." />
              </SelectTrigger>
              <SelectContent className="glass-strong border-white/20">
                {daysOfWeek.map((day) => (
                  <SelectItem key={day.value} value={day.value} className="text-white hover:bg-white/10">
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-white/60 text-xs mt-1">
              Workouts will be scheduled relative to this day
            </p>
          </div>

          {workouts && workouts.length > 0 && (
            <div className="glass rounded-xl p-3">
              <p className="text-white/70 text-sm mb-2">Preview:</p>
              <div className="space-y-1">
                {workouts.filter(w => w.week_number === 1).slice(0, 3).map((workout) => (
                  <div key={workout.id} className="flex justify-between text-xs text-white/60">
                    <span className="capitalize">{workout.day_of_week}</span>
                    <span>{workout.name}</span>
                  </div>
                ))}
                {workouts.filter(w => w.week_number === 1).length > 3 && (
                  <p className="text-white/50 text-xs">+{workouts.filter(w => w.week_number === 1).length - 3} more in week 1</p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 glass px-6 py-3 rounded-xl text-white/70 font-light hover:glass-strong transition-all duration-300"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 glass px-6 py-3 rounded-xl text-white font-light hover:glass-strong transition-all duration-300"
            >
              Start Program
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}