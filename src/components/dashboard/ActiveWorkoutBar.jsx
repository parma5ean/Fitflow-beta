import React, { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Dumbbell, Play, Clock, X } from "lucide-react";
import { format } from "date-fns";

export default function ActiveWorkoutBar() {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = React.useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: Infinity
  });

  const { data: activeSessions } = useQuery({
    queryKey: ['activeSessions', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.ActiveSession.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user,
    initialData: [],
    refetchInterval: 30000 // Refetch every 30 seconds to keep it updated
  });

  const activeSession = activeSessions && activeSessions.length > 0 ? activeSessions[0] : null;

  // Reset dismissed state when activeSession disappears
  useEffect(() => {
    if (!activeSession && dismissed) {
      console.log('>>> Active session disappeared, resetting dismissed state in ActiveWorkoutBar');
      setDismissed(false);
    }
  }, [activeSession, dismissed]);

  // Don't show if dismissed or no active session
  if (dismissed || !activeSession) {
    return null;
  }

  const handleContinue = () => {
    if (activeSession?.workout_id) {
      navigate(createPageUrl('WorkoutSession') + `?workoutId=${activeSession.workout_id}&activeSessionId=${activeSession.id}`);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  const sessionDate = new Date(activeSession.start_time);
  const isToday = format(sessionDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const elapsedMinutes = activeSession.session_data?.overallSecondsElapsed 
    ? Math.floor(activeSession.session_data.overallSecondsElapsed / 60) 
    : 0;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] glass-strong border-b border-white/10 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="glass p-2 rounded-xl">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-light text-sm truncate">
                Workout in progress: {activeSession.workout_name}
              </p>
              <div className="flex items-center gap-3 text-white/70 text-xs">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {elapsedMinutes} min
                </span>
                <span>
                  Started {format(sessionDate, isToday ? 'h:mm a' : 'MMM d, h:mm a')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleContinue}
              className="glass px-4 py-2 rounded-xl text-white font-light hover:glass-strong transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
            >
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">Continue</span>
            </button>
            <button
              onClick={handleDismiss}
              className="glass p-2 rounded-xl text-white/70 hover:text-white hover:glass-strong transition-all duration-300"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}