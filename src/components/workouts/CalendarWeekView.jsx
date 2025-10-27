import React, { useState } from "react";
import { format, isSameDay } from "date-fns";
import { X, Copy, Plus, Clock } from "lucide-react";

export default function CalendarWeekView({ 
  weekDays, 
  scheduledWorkouts, 
  templates,
  onScheduleWorkout,
  onRemoveWorkout,
  onCopyWorkout,
  onWorkoutClick,
  onQuickAdd
}) {
  const [draggedOverDay, setDraggedOverDay] = useState(null);

  const handleDrop = (e, date) => {
    e.preventDefault();
    setDraggedOverDay(null);
    const templateData = e.dataTransfer.getData('template');
    if (templateData) {
      const template = JSON.parse(templateData);
      onScheduleWorkout(date, template);
    }
  };

  const handleDragOver = (e, dayIndex) => {
    e.preventDefault();
    setDraggedOverDay(dayIndex);
  };

  const handleDragLeave = () => {
    setDraggedOverDay(null);
  };

  const getWorkoutsForDay = (date) => {
    return scheduledWorkouts
      .map((workout, index) => ({ ...workout, originalIndex: index }))
      .filter(workout => {
        if (!workout.scheduled_date) return false;
        return isSameDay(new Date(workout.scheduled_date), date);
      });
  };

  return (
    <div className="grid grid-cols-7 gap-3">
      {weekDays.map((day, index) => {
        const dayWorkouts = getWorkoutsForDay(day);
        const dayName = format(day, 'EEE');
        const dayNumber = format(day, 'd');
        const isToday = isSameDay(day, new Date());
        const isDraggedOver = draggedOverDay === index;

        return (
          <div
            key={index}
            onDrop={(e) => handleDrop(e, day)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            className={`glass rounded-2xl transition-all duration-300 ${
              isToday ? 'ring-2 ring-white/30' : ''
            } ${
              isDraggedOver ? 'ring-2 ring-white/60 bg-white/10 scale-105' : 'hover:glass-strong'
            }`}
          >
            {/* Day Header */}
            <div className="text-center p-3 border-b border-white/10">
              <p className="text-white/70 text-xs font-light">{dayName}</p>
              <p className="text-white text-lg font-light">{dayNumber}</p>
            </div>

            {/* Workouts List */}
            <div className="p-2 space-y-2 min-h-[120px]">
              {dayWorkouts.length > 0 ? (
                <>
                  {dayWorkouts.map((workout) => (
                    <div
                      key={workout.originalIndex}
                      onClick={() => onWorkoutClick && onWorkoutClick(scheduledWorkouts[workout.originalIndex], day)}
                      className="glass rounded-lg p-2 group relative cursor-pointer hover:glass-strong transition-all duration-200"
                    >
                      <p className="text-white text-xs font-light pr-6 line-clamp-1 mb-1">
                        {workout.name}
                      </p>
                      <div className="flex items-center gap-2 text-white/50 text-[10px]">
                        {workout.duration_minutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {workout.duration_minutes}m
                          </span>
                        )}
                        <span>
                          {workout.sections?.reduce((total, section) => total + (section.exercises?.length || 0), 0) || workout.exercises?.length || 0} ex
                        </span>
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCopyWorkout(workout);
                          }}
                          className="glass p-1 rounded hover:glass-strong"
                          title="Copy"
                        >
                          <Copy className="w-3 h-3 text-white" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveWorkout(workout.originalIndex);
                          }}
                          className="glass p-1 rounded hover:glass-strong"
                          title="Remove"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add More Button */}
                  <button
                    onClick={() => onQuickAdd(day)}
                    className="w-full glass rounded-lg p-2 text-white/50 hover:text-white hover:glass-strong transition-all duration-200 flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span className="text-xs font-light">Add</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Empty State with Add Button */}
                  <div className="flex flex-col items-center justify-center h-full py-4">
                    <button
                      onClick={() => onQuickAdd(day)}
                      className={`glass rounded-xl p-3 text-white/50 hover:text-white hover:glass-strong transition-all duration-200 ${
                        isDraggedOver ? 'scale-110 text-white' : ''
                      }`}
                    >
                      <Plus className="w-6 h-6 mx-auto mb-1" />
                      <span className="text-[10px] font-light">
                        {isDraggedOver ? 'Drop here' : 'Add workout'}
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}