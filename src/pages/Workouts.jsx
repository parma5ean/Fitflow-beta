import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Dumbbell, Calendar } from "lucide-react";
import { createPageUrl } from "@/utils";
import WorkoutPlanCard from "../components/workouts/WorkoutPlanCard";
import WorkoutSessionDialog from "../components/workouts/WorkoutSessionDialog";

export default function Workouts() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showWorkoutDialog, setShowWorkoutDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: plans, isLoading } = useQuery({
    queryKey: ['workoutPlans'],
    queryFn: () => base44.entities.WorkoutPlan.list('-created_date'),
    initialData: [],
  });

  const { data: scheduledWorkouts } = useQuery({
    queryKey: ['scheduledWorkouts'],
    queryFn: () => base44.entities.Workout.filter({ is_template: false }),
    initialData: [],
  });

  const setActiveMutation = useMutation({
    mutationFn: async (planId) => {
      await Promise.all(
        plans.map(plan => 
          base44.entities.WorkoutPlan.update(plan.id, { is_active: plan.id === planId })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutPlans'] });
    },
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="glass-strong rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Dumbbell className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-3xl md:text-4xl font-light text-white">Workout Plans</h1>
              <p className="text-white/70">Manage your training programs</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(createPageUrl('WorkoutTemplates'))}
              className="glass px-6 py-3 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300"
            >
              <Dumbbell className="w-5 h-5 inline mr-2" />
              Templates
            </button>
            <button
              onClick={() => navigate(createPageUrl('CalendarPlanBuilder'))}
              className="glass px-6 py-3 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300 shadow-lg"
            >
              <Plus className="w-5 h-5 inline mr-2" />
              Create Plan
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      ) : plans.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const planWorkouts = scheduledWorkouts.filter(w => w.plan_id === plan.id);
            return (
              <WorkoutPlanCard
                key={plan.id}
                plan={plan}
                workouts={planWorkouts}
                onSetActive={() => setActiveMutation.mutate(plan.id)}
                onEdit={() => navigate(createPageUrl('CalendarPlanBuilder') + `?planId=${plan.id}`)}
                onStartWorkout={() => {
                  setSelectedPlan(plan);
                  setShowWorkoutDialog(true);
                }}
              />
            );
          })}
        </div>
      ) : (
        <div className="glass-strong rounded-3xl p-12 text-center shadow-2xl">
          <Calendar className="w-16 h-16 text-white/30 mx-auto mb-6" />
          <h3 className="text-2xl font-light text-white mb-2">No Workout Plans Yet</h3>
          <p className="text-white/70 mb-6">Create your first workout plan using the calendar builder</p>
          <button
            onClick={() => navigate(createPageUrl('CalendarPlanBuilder'))}
            className="glass px-8 py-4 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            Create Your First Plan
          </button>
        </div>
      )}

      <WorkoutSessionDialog
        open={showWorkoutDialog}
        plan={selectedPlan}
        onClose={() => {
          setShowWorkoutDialog(false);
          setSelectedPlan(null);
        }}
      />
    </div>
  );
}