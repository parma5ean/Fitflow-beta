import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, Play, CheckCircle, Trash2, Pause } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

export default function UnfinishedSessionDialog({ session, onContinue, onComplete, onDiscard, onPause, onClose }) {
  const [completedDate, setCompletedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [durationMinutes, setDurationMinutes] = useState("");
  const [showCompleteForm, setShowCompleteForm] = useState(false);

  if (!session) return null;

  const sessionDate = new Date(session.start_time);
  const isToday = format(sessionDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  const handlePause = () => {
    if (onPause) {
      onPause();
    }
    onClose();
  };

  return (
    <Dialog open={!!session} onOpenChange={onClose}>
      <DialogContent className="glass-strong border-white/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-light flex items-center gap-2">
            <Clock className="w-6 h-6" />
            Unfinished Workout
          </DialogTitle>
        </DialogHeader>

        {!showCompleteForm ? (
          <div className="space-y-4">
            <div className="glass rounded-2xl p-4">
              <p className="text-white font-light text-lg mb-2">{session.workout_name}</p>
              <p className="text-white/70 text-sm">
                Started: {format(sessionDate, isToday ? 'h:mm a' : 'MMM d, h:mm a')}
              </p>
              {session.session_data?.overallSecondsElapsed > 0 && (
                <p className="text-white/70 text-sm">
                  Duration: {Math.floor(session.session_data.overallSecondsElapsed / 60)} minutes
                </p>
              )}
            </div>

            <p className="text-white/90 text-sm">
              You have an unfinished workout session. Would you like to continue where you left off?
            </p>

            <div className="space-y-2">
              <button
                onClick={onContinue}
                className="w-full glass px-6 py-4 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Continue Workout
              </button>

              <button
                onClick={handlePause}
                className="w-full glass px-6 py-4 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Pause className="w-5 h-5" />
                Pause and Continue Later
              </button>

              <button
                onClick={() => setShowCompleteForm(true)}
                className="w-full glass px-6 py-4 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Mark as Complete
              </button>

              <button
                onClick={onDiscard}
                className="w-full glass px-6 py-4 rounded-2xl text-red-400 font-light hover:glass-strong transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Discard Session
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-white/90 text-sm">
              Complete the workout details for this session:
            </p>

            <div>
              <Label className="text-white/90 font-light">Completed Date</Label>
              <Input
                type="date"
                value={completedDate}
                onChange={(e) => setCompletedDate(e.target.value)}
                className="glass border-white/20 text-white mt-1 font-light"
              />
            </div>

            <div>
              <Label className="text-white/90 font-light">Duration (minutes)</Label>
              <Input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="glass border-white/20 text-white mt-1 font-light"
                placeholder="60"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowCompleteForm(false)}
                className="flex-1 glass px-6 py-3 rounded-xl text-white font-light hover:glass-strong transition-all duration-300"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (durationMinutes) {
                    onComplete(completedDate, parseInt(durationMinutes));
                    setShowCompleteForm(false);
                  }
                }}
                disabled={!durationMinutes}
                className="flex-1 glass px-6 py-3 rounded-xl text-white font-light hover:glass-strong transition-all duration-300 disabled:opacity-50"
              >
                Complete
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}