import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit, Copy, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

export default function WorkoutQuickEditPopover({ workout, workoutDate, onClose, onUpdate, onRemove, onDuplicate }) {
  const [editMode, setEditMode] = useState(false);
  const [editedName, setEditedName] = useState(workout.name);
  const [editedDuration, setEditedDuration] = useState(workout.duration_minutes || '');

  const handleSave = () => {
    onUpdate({
      name: editedName,
      duration_minutes: editedDuration ? parseInt(editedDuration) : null
    });
    setEditMode(false);
  };

  const exerciseCount = workout.sections 
    ? workout.sections.reduce((total, section) => total + (section.exercises?.length || 0), 0)
    : workout.exercises?.length || 0;

  return (
    <Dialog open={!!workout} onOpenChange={onClose}>
      <DialogContent className="glass-strong border-white/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-light flex items-center justify-between">
            Quick Edit
            <button onClick={onClose} className="glass p-1 rounded-lg hover:glass-strong">
              <X className="w-4 h-4" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!editMode ? (
            <>
              <div className="glass rounded-2xl p-4">
                <h3 className="text-white font-light text-lg mb-2">{workout.name}</h3>
                <div className="space-y-1 text-sm">
                  <p className="text-white/70">
                    {format(new Date(workoutDate), 'EEEE, MMM d, yyyy')}
                  </p>
                  <p className="text-white/70">
                    {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
                  </p>
                  {workout.duration_minutes && (
                    <p className="text-white/70">~{workout.duration_minutes} minutes</p>
                  )}
                </div>
              </div>

              {/* Exercise Preview */}
              {workout.sections && workout.sections.length > 0 && (
                <div className="glass rounded-2xl p-4 max-h-48 overflow-y-auto">
                  <p className="text-white/70 text-sm mb-2">Exercises:</p>
                  <div className="space-y-1">
                    {workout.sections.map((section, sIdx) => (
                      <div key={sIdx}>
                        {section.exercises?.map((ex, eIdx) => (
                          <p key={eIdx} className="text-white/90 text-sm">
                            • {ex.custom_name || 'Exercise'} 
                            <span className="text-white/50 text-xs ml-2">
                              ({ex.sets_data?.length || 0} sets)
                            </span>
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => setEditMode(true)}
                  className="w-full glass px-4 py-3 rounded-xl text-white font-light hover:glass-strong transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Details
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onDuplicate();
                      onClose();
                    }}
                    className="glass px-4 py-3 rounded-xl text-white font-light hover:glass-strong transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('Remove this workout from the plan?')) {
                        onRemove();
                        onClose();
                      }
                    }}
                    className="glass px-4 py-3 rounded-xl text-red-400 font-light hover:glass-strong transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <Label className="text-white/90 font-light">Workout Name</Label>
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="glass border-white/20 text-white mt-1 font-light"
                  />
                </div>

                <div>
                  <Label className="text-white/90 font-light">Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={editedDuration}
                    onChange={(e) => setEditedDuration(e.target.value)}
                    className="glass border-white/20 text-white mt-1 font-light"
                    placeholder="45"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditMode(false)}
                  className="flex-1 glass px-4 py-3 rounded-xl text-white font-light hover:glass-strong transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 glass px-4 py-3 rounded-xl text-white font-light hover:glass-strong transition-all duration-300"
                >
                  Save Changes
                </button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}