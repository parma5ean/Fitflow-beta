
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Calendar, Flame, Target, TrendingUp, Plus, Dumbbell } from "lucide-react";
import { format } from "date-fns";
import TodayWorkout from "../components/dashboard/TodayWorkout";
import MacroOverview from "../components/dashboard/MacroOverview";
import QuickStats from "../components/dashboard/QuickStats";
import RecentProgress from "../components/dashboard/RecentProgress";
import MotivationalQuoteCard from "../components/dashboard/MotivationalQuoteCard";
import UnfinishedSessionDialog from "../components/dashboard/UnfinishedSessionDialog";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [unfinishedSession, setUnfinishedSession] = useState(null);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [userHasDismissed, setUserHasDismissed] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
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

  // Check for unfinished sessions
  const { data: activeSessions } = useQuery({
    queryKey: ['activeSessions', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.ActiveSession.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user,
    initialData: []
  });

  useEffect(() => {
    // Only show dialog if:
    // 1. There are active sessions
    // 2. Dialog is not currently showing
    // 3. User hasn't explicitly dismissed it
    if (activeSessions && activeSessions.length > 0 && !showSessionDialog && !userHasDismissed) {
      const mostRecent = activeSessions[0];
      setUnfinishedSession(mostRecent);
      setShowSessionDialog(true);
    }
    
    // If no active sessions, reset the dismissed state
    if (!activeSessions || activeSessions.length === 0) {
      setUserHasDismissed(false);
    }
  }, [activeSessions, showSessionDialog, userHasDismissed]);

  const { data: todayWorkouts } = useQuery({
    queryKey: ['todayWorkouts', today],
    queryFn: () => base44.entities.Workout.filter({ scheduled_date: today, is_template: false }),
    initialData: []
  });

  const { data: todayFood } = useQuery({
    queryKey: ['todayFood', today],
    queryFn: () => base44.entities.FoodLog.filter({ date: today }),
    initialData: []
  });

  const { data: recentProgress } = useQuery({
    queryKey: ['recentProgress'],
    queryFn: () => base44.entities.ProgressLog.list('-date', 5),
    initialData: []
  });

  const todayCalories = todayFood.reduce((sum, food) => sum + (food.calories || 0), 0);
  const todayProtein = todayFood.reduce((sum, food) => sum + (food.protein || 0), 0);
  const todayCarbs = todayFood.reduce((sum, food) => sum + (food.carbs || 0), 0);
  const todayFats = todayFood.reduce((sum, food) => sum + (food.fats || 0), 0);

  const handleContinueSession = () => {
    if (unfinishedSession?.workout_id) {
      navigate(createPageUrl('WorkoutSession') + `?workoutId=${unfinishedSession.workout_id}&activeSessionId=${unfinishedSession.id}`);
      setShowSessionDialog(false);
      setUserHasDismissed(true);
    } else {
      console.error("No workout ID found for unfinished session.");
    }
  };

  const handlePauseSession = () => {
    // Just dismiss the dialog - session remains active
    setShowSessionDialog(false);
    setUserHasDismissed(true);
  };

  const handleCompleteSession = async (completedDate, durationMinutes) => {
    if (!unfinishedSession) {
      console.error("No unfinished session to complete.");
      return;
    }

    try {
      const sectionsToUpdate = unfinishedSession.session_data?.workoutData?.sections || [];

      await base44.entities.Workout.update(unfinishedSession.workout_id, {
        is_completed: true,
        completed_date: completedDate,
        duration_minutes: durationMinutes,
        sections: sectionsToUpdate
      });

      await base44.entities.ActiveSession.delete(unfinishedSession.id);
      
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['activeSessions'] });
      queryClient.invalidateQueries({ queryKey: ['scheduledWorkouts'] });
      queryClient.invalidateQueries({ queryKey: ['todayWorkouts'] });
      queryClient.invalidateQueries({ queryKey: ['activeSession'] }); // Added this invalidation
      
      setShowSessionDialog(false);
      setUnfinishedSession(null);
      setUserHasDismissed(false);
    } catch (error) {
      console.error("Error completing session:", error);
      alert("Failed to complete session. Please try again.");
    }
  };

  const handleDiscardSession = async () => {
    if (!unfinishedSession) {
      console.error("No unfinished session to discard.");
      return;
    }

    if (confirm('Are you sure you want to discard this workout session? All progress will be lost.')) {
      try {
        console.log('>>> Discarding session:', unfinishedSession.id);
        
        // Delete the session
        await base44.entities.ActiveSession.delete(unfinishedSession.id);
        
        console.log('>>> Session deleted, invalidating queries');
        
        // Immediately update local state
        setShowSessionDialog(false);
        setUnfinishedSession(null);
        setUserHasDismissed(false); // Changed from true to false
        
        // Invalidate all queries that might be caching the session
        await queryClient.invalidateQueries({ queryKey: ['activeSessions'] });
        await queryClient.invalidateQueries({ queryKey: ['activeSession'] }); // Added this invalidation
        
        // Force refetch to ensure UI updates
        await queryClient.refetchQueries({ queryKey: ['activeSessions', user?.email] });
        
        console.log('>>> Queries invalidated and refetched');
      } catch (error) {
        console.error("Error discarding session:", error);
        alert("Failed to discard session. Please try again.");
      }
    } else {
      // User cancelled the discard, just close the dialog
      setShowSessionDialog(false);
      setUserHasDismissed(true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome Header */}
      <div className="glass-strong rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-light text-white mb-2">
              Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
            </h1>
            <p className="text-white/70 text-lg">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <Link to={createPageUrl("Programs")}>
              <button className="glass px-6 py-3 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300 shadow-lg">
                <Plus className="w-5 h-5 inline mr-2" />
                New Workout
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Motivational Quote Card */}
      <MotivationalQuoteCard />

      {/* Quick Stats */}
      <QuickStats 
        user={user}
        todayWorkouts={todayWorkouts}
        recentProgress={recentProgress}
      />

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Workout */}
        <div className="lg:col-span-2 space-y-6">
          <TodayWorkout 
            todayWorkouts={todayWorkouts}
          />
          
          <RecentProgress progressLogs={recentProgress} />
        </div>

        {/* Right Column - Nutrition */}
        <div className="space-y-6">
          <MacroOverview
            user={user}
            todayCalories={todayCalories}
            todayProtein={todayProtein}
            todayCarbs={todayCarbs}
            todayFats={todayFats}
          />
        </div>
      </div>
      
      {showSessionDialog && unfinishedSession && (
        <UnfinishedSessionDialog
          session={unfinishedSession}
          onContinue={handleContinueSession}
          onComplete={handleCompleteSession}
          onDiscard={handleDiscardSession}
          onPause={handlePauseSession}
          onClose={() => {
            setShowSessionDialog(false);
            setUserHasDismissed(true);
          }}
        />
      )}
    </div>
  );
}
