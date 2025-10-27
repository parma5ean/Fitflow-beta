
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Save, ChevronLeft, ChevronRight, ArrowRight, Sparkles, Filter, Search, X, ChevronUp, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"; // Added Dialog imports
import { createPageUrl } from "@/utils";
import { format, addWeeks, startOfWeek, addDays } from "date-fns";
import CalendarWeekView from "../components/workouts/CalendarWeekView";
import PlanSummaryPanel from "../components/workouts/PlanSummaryPanel";
import WorkoutQuickEditPopover from "../components/workouts/WorkoutQuickEditPopover";

const PRESET_SPLITS = {
  '3_day_full': {
    name: '3-Day Full Body',
    days: ['Monday', 'Wednesday', 'Friday'],
    description: 'Train full body 3x per week with rest days in between'
  },
  '4_day_upper_lower': {
    name: '4-Day Upper/Lower',
    days: ['Monday: Upper', 'Tuesday: Lower', 'Thursday: Upper', 'Friday: Lower'],
    description: 'Alternate between upper and lower body workouts'
  },
  '5_day_ppl': {
    name: '5-Day Push/Pull/Legs',
    days: ['Monday: Push', 'Tuesday: Pull', 'Wednesday: Legs', 'Friday: Push', 'Saturday: Pull'],
    description: 'Push, pull, legs split with dedicated focus days'
  },
  '6_day_ppl': {
    name: '6-Day Push/Pull/Legs',
    days: ['Monday: Push', 'Tuesday: Pull', 'Wednesday: Legs', 'Thursday: Push', 'Friday: Pull', 'Saturday: Legs'],
    description: 'High frequency push, pull, legs split'
  },
  'custom': {
    name: 'Custom Split',
    days: [],
    description: 'Define your own training schedule'
  }
};

export default function CalendarPlanBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const planId = new URLSearchParams(location.search).get('planId');

  // Wizard steps
  const [currentStep, setCurrentStep] = useState(1);
  const [planData, setPlanData] = useState({
    name: "",
    description: "",
    goal: "general_fitness",
    start_date: format(new Date(), 'yyyy-MM-dd'),
    duration_weeks: 4
  });
  const [selectedSplit, setSelectedSplit] = useState('3_day_full');
  const [customSplitDays, setCustomSplitDays] = useState([]);

  // Calendar and workout state
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [scheduledWorkouts, setScheduledWorkouts] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [selectedWorkoutDate, setSelectedWorkoutDate] = useState(null);

  // Template library state
  const [templateSearchTerm, setTemplateSearchTerm] = useState("");
  const [templateFilterGoal, setTemplateFilterGoal] = useState("all");
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(true);

  // History for undo/redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // New state for quick add dialog
  const [showQuickAddDialog, setShowQuickAddDialog] = useState(false);
  const [quickAddDate, setQuickAddDate] = useState(null);

  const { data: existingPlan } = useQuery({
    queryKey: ['workoutPlan', planId],
    queryFn: async () => {
      if (!planId) return null;
      const plans = await base44.entities.WorkoutPlan.filter({ id: planId });
      return plans[0] || null;
    },
    enabled: !!planId
  });

  const { data: existingScheduledWorkouts } = useQuery({
    queryKey: ['planScheduledWorkouts', planId],
    queryFn: () => base44.entities.Workout.filter({ plan_id: planId, is_template: false }),
    enabled: !!planId,
    initialData: []
  });

  const { data: templates } = useQuery({
    queryKey: ['workoutTemplates'],
    queryFn: () => base44.entities.Workout.filter({ is_template: true }),
    initialData: []
  });

  useEffect(() => {
    if (existingPlan) {
      setPlanData({
        name: existingPlan.name,
        description: existingPlan.description || "",
        goal: existingPlan.goal,
        start_date: existingPlan.start_date || format(new Date(), 'yyyy-MM-dd'),
        duration_weeks: existingPlan.duration_weeks || 4
      });
      setCurrentStep(3); // Skip to calendar if editing
    }
  }, [existingPlan]);

  useEffect(() => {
    if (existingScheduledWorkouts.length > 0) {
      setScheduledWorkouts(existingScheduledWorkouts);
    }
  }, [existingScheduledWorkouts]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      let savedPlanId = planId;

      if (planId) {
        await base44.entities.WorkoutPlan.update(planId, planData);
      } else {
        const newPlan = await base44.entities.WorkoutPlan.create(planData);
        savedPlanId = newPlan.id;
      }

      // Delete existing scheduled workouts for this plan
      for (const workout of existingScheduledWorkouts) {
        await base44.entities.Workout.delete(workout.id);
      }

      // Create new scheduled workouts
      for (const workout of scheduledWorkouts) {
        const { id, created_date, updated_date, created_by, ...workoutData } = workout;
        await base44.entities.Workout.create({
          ...workoutData,
          plan_id: savedPlanId,
          is_template: false
        });
      }

      return savedPlanId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutPlans'] });
      queryClient.invalidateQueries({ queryKey: ['scheduledWorkouts'] });
      navigate(createPageUrl('Workouts'));
    }
  });

  const getCurrentWeekStart = () => {
    const planStart = new Date(planData.start_date);
    return startOfWeek(addWeeks(planStart, currentWeekOffset), { weekStartsOn: 1 });
  };

  const addToHistory = (newWorkouts) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newWorkouts]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleScheduleWorkout = (date, template) => {
    const { id, created_date, updated_date, created_by, is_template, ...templateData } = template;
    
    const newWorkout = {
      ...templateData,
      template_id: template.id,
      scheduled_date: format(date, 'yyyy-MM-dd'),
      is_completed: false,
      plan_id: planId || null
    };

    const updatedWorkouts = [...scheduledWorkouts, newWorkout];
    setScheduledWorkouts(updatedWorkouts);
    addToHistory(updatedWorkouts);
    setShowQuickAddDialog(false); // Added this line
  };

  const handleRemoveWorkout = (index) => {
    const updatedWorkouts = scheduledWorkouts.filter((_, i) => i !== index);
    setScheduledWorkouts(updatedWorkouts);
    addToHistory(updatedWorkouts);
    setSelectedWorkout(null);
  };

  const handleCopyWorkout = (workout) => {
    const { id, created_date, updated_date, created_by, scheduled_date, ...workoutData } = workout;
    const updatedWorkouts = [...scheduledWorkouts, { ...workoutData, scheduled_date }];
    setScheduledWorkouts(updatedWorkouts);
    addToHistory(updatedWorkouts);
  };

  const handleUpdateWorkout = (index, updates) => {
    const updatedWorkouts = [...scheduledWorkouts];
    updatedWorkouts[index] = { ...updatedWorkouts[index], ...updates };
    setScheduledWorkouts(updatedWorkouts);
    addToHistory(updatedWorkouts);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setScheduledWorkouts(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setScheduledWorkouts(history[historyIndex + 1]);
    }
  };

  // New function for quick add dialog
  const openQuickAdd = (date) => {
    setQuickAddDate(date);
    setShowQuickAddDialog(true);
  };

  const getSuggestedTemplates = (date) => {
    if (!templates || templates.length === 0) return [];

    const dayOfWeek = format(date, 'EEEE');
    const splitInfo = PRESET_SPLITS[selectedSplit];
    
    if (!splitInfo || selectedSplit === 'custom') return templates;

    // Find which day in the split this corresponds to
    const splitDay = splitInfo.days.find(d => d.includes(dayOfWeek));
    
    if (!splitDay) return templates;

    // Extract the workout type from the split day (e.g., "Push" from "Monday: Push")
    const workoutType = splitDay.split(':')[1]?.trim().toLowerCase();

    if (!workoutType) return templates;

    // Filter templates based on name containing the workout type
    const suggested = templates.filter(t => 
      t.name.toLowerCase().includes(workoutType) ||
      t.name.toLowerCase().includes(dayOfWeek.toLowerCase())
    );

    return suggested.length > 0 ? suggested : templates;
  };

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = !templateSearchTerm || 
      t.name.toLowerCase().includes(templateSearchTerm.toLowerCase());
    const matchesGoal = templateFilterGoal === 'all' || 
      t.name.toLowerCase().includes(templateFilterGoal);
    return matchesSearch && matchesGoal;
  });

  const weekStart = getCurrentWeekStart();
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Step 1: Plan Basics
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="glass-strong rounded-3xl p-6 shadow-2xl space-y-4">
        <h3 className="text-2xl font-light text-white mb-4">Plan Basics</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-white/90 font-light">Plan Name</Label>
            <Input
              value={planData.name}
              onChange={(e) => setPlanData({ ...planData, name: e.target.value })}
              className="glass border-white/20 text-white mt-1 font-light"
              placeholder="Summer Training Program"
            />
          </div>

          <div>
            <Label className="text-white/90 font-light">Primary Goal</Label>
            <Select
              value={planData.goal}
              onValueChange={(value) => setPlanData({ ...planData, goal: value })}
            >
              <SelectTrigger className="glass border-white/20 text-white mt-1 font-light">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-strong border-white/20">
                <SelectItem value="strength">Strength</SelectItem>
                <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                <SelectItem value="fat_loss">Fat Loss</SelectItem>
                <SelectItem value="endurance">Endurance</SelectItem>
                <SelectItem value="general_fitness">General Fitness</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-white/90 font-light">Description</Label>
          <Textarea
            value={planData.description}
            onChange={(e) => setPlanData({ ...planData, description: e.target.value })}
            className="glass border-white/20 text-white mt-1 font-light"
            placeholder="Describe your workout plan..."
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-white/90 font-light">Start Date</Label>
            <Input
              type="date"
              value={planData.start_date}
              onChange={(e) => setPlanData({ ...planData, start_date: e.target.value })}
              className="glass border-white/20 text-white mt-1 font-light"
            />
          </div>
          <div>
            <Label className="text-white/90 font-light">Duration (weeks)</Label>
            <Input
              type="number"
              value={planData.duration_weeks}
              onChange={(e) => setPlanData({ ...planData, duration_weeks: parseInt(e.target.value) })}
              className="glass border-white/20 text-white mt-1 font-light"
              min="1"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setCurrentStep(2)}
          disabled={!planData.name}
          className="glass px-8 py-4 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
        >
          Next: Training Split <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  // Step 2: Training Split
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="glass-strong rounded-3xl p-6 shadow-2xl">
        <h3 className="text-2xl font-light text-white mb-4">Choose Your Training Split</h3>
        <p className="text-white/70 mb-6">Select a preset split or create your own custom schedule</p>

        <div className="grid md:grid-cols-2 gap-4">
          {Object.entries(PRESET_SPLITS).map(([key, split]) => (
            <button
              key={key}
              onClick={() => setSelectedSplit(key)}
              className={`glass rounded-2xl p-6 text-left hover:glass-strong transition-all duration-300 ${
                selectedSplit === key ? 'ring-2 ring-white shadow-[0_0_20px_rgba(255,255,255,0.3)]' : ''
              }`}
            >
              <h4 className="text-white font-light text-lg mb-2">{split.name}</h4>
              <p className="text-white/70 text-sm mb-4">{split.description}</p>
              {split.days.length > 0 && (
                <div className="space-y-1">
                  {split.days.slice(0, 3).map((day, i) => (
                    <p key={i} className="text-white/60 text-xs">{day}</p>
                  ))}
                  {split.days.length > 3 && (
                    <p className="text-white/50 text-xs">+{split.days.length - 3} more...</p>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(1)}
          className="glass px-8 py-4 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <button
          onClick={() => setCurrentStep(3)}
          className="glass px-8 py-4 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300 flex items-center gap-2"
        >
          Next: Build Workouts <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  // Step 3: Calendar & Workout Building
  const renderStep3 = () => (
    <div className="grid lg:grid-cols-4 gap-6">
      {/* Main Calendar Area */}
      <div className="lg:col-span-3 space-y-6">
        {/* Week Navigation */}
        <div className="glass-strong rounded-3xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)}
              disabled={currentWeekOffset <= 0}
              className="glass p-2 rounded-xl hover:glass-strong transition-all duration-300 disabled:opacity-30"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            
            <div className="text-center">
              <h3 className="text-xl font-light text-white">
                Week {currentWeekOffset + 1} of {planData.duration_weeks}
              </h3>
              <p className="text-white/70 text-sm">
                {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
              </p>
            </div>
            
            <button
              onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
              disabled={currentWeekOffset >= planData.duration_weeks - 1}
              className="glass p-2 rounded-xl hover:glass-strong transition-all duration-300 disabled:opacity-30"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </div>

          <CalendarWeekView
            weekDays={weekDays}
            scheduledWorkouts={scheduledWorkouts}
            templates={getSuggestedTemplates(weekDays[0])}
            onScheduleWorkout={handleScheduleWorkout}
            onRemoveWorkout={handleRemoveWorkout}
            onCopyWorkout={handleCopyWorkout}
            onWorkoutClick={(workout, date) => {
              setSelectedWorkout(workout);
              setSelectedWorkoutDate(date);
            }}
            onQuickAdd={openQuickAdd}
          />
        </div>

        {/* Plan Summary */}
        <PlanSummaryPanel
          scheduledWorkouts={scheduledWorkouts}
          planData={planData}
        />
      </div>

      {/* Template Library Sidebar */}
      <div className="lg:col-span-1">
        <div className="glass-strong rounded-3xl p-6 shadow-2xl sticky top-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-light text-white">Templates</h3>
            <button
              onClick={() => setShowTemplateLibrary(!showTemplateLibrary)}
              className="glass p-2 rounded-xl hover:glass-strong transition-all duration-300"
            >
              {showTemplateLibrary ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-white" />}
            </button>
          </div>

          {showTemplateLibrary && (
            <>
              {/* Search & Filter */}
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                  <Input
                    value={templateSearchTerm}
                    onChange={(e) => setTemplateSearchTerm(e.target.value)}
                    className="glass border-white/20 text-white pl-10 font-light text-sm"
                    placeholder="Search templates..."
                  />
                  {templateSearchTerm && (
                    <button
                      onClick={() => setTemplateSearchTerm("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <X className="w-4 h-4 text-white/50" />
                    </button>
                  )}
                </div>

                <Select value={templateFilterGoal} onValueChange={setTemplateFilterGoal}>
                  <SelectTrigger className="glass border-white/20 text-white font-light text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-strong border-white/20">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="push">Push</SelectItem>
                    <SelectItem value="pull">Pull</SelectItem>
                    <SelectItem value="legs">Legs</SelectItem>
                    <SelectItem value="upper">Upper</SelectItem>
                    <SelectItem value="lower">Lower</SelectItem>
                    <SelectItem value="full">Full Body</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Template List */}
              {filteredTemplates.length > 0 ? (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('template', JSON.stringify(template));
                      }}
                      className="glass rounded-xl p-3 cursor-move hover:glass-strong transition-all duration-300"
                    >
                      <p className="text-white font-light text-sm mb-1">{template.name}</p>
                      <p className="text-white/50 text-xs">
                        {template.sections?.reduce((total, section) => total + (section.exercises?.length || 0), 0) || template.exercises?.length || 0} exercises
                      </p>
                      {template.duration_minutes && (
                        <p className="text-white/50 text-xs">~{template.duration_minutes} min</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-white/70 text-sm mb-4">No templates found</p>
                  <button
                    onClick={() => navigate(createPageUrl('WorkoutTemplates'))}
                    className="glass px-4 py-2 rounded-xl text-white text-sm hover:glass-strong transition-all duration-300"
                  >
                    Create Template
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Quick Add Dialog */}
      {showQuickAddDialog && (
        <Dialog open={showQuickAddDialog} onOpenChange={setShowQuickAddDialog}>
          <DialogContent className="glass-strong border-white/20 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-light">
                Add Workout - {quickAddDate && format(quickAddDate, 'EEEE, MMM d')}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              <p className="text-white/70 text-sm mb-4">Select a template to add:</p>
              {filteredTemplates.length > 0 ? (
                filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleScheduleWorkout(quickAddDate, template)}
                    className="w-full glass rounded-xl p-4 text-left hover:glass-strong transition-all duration-300"
                  >
                    <p className="text-white font-light mb-1">{template.name}</p>
                    <p className="text-white/50 text-xs">
                      {template.sections?.reduce((total, section) => total + (section.exercises?.length || 0), 0) || template.exercises?.length || 0} exercises
                      {template.duration_minutes && ` • ~${template.duration_minutes} min`}
                    </p>
                  </button>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-white/70 text-sm mb-4">No templates available</p>
                  <button
                    onClick={() => navigate(createPageUrl('WorkoutTemplates'))}
                    className="glass px-4 py-2 rounded-xl text-white text-sm hover:glass-strong transition-all duration-300"
                  >
                    Create Template
                  </button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );

  if (!planId && currentStep < 3) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass-strong rounded-3xl p-6 md:p-8 shadow-2xl">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(createPageUrl('Workouts'))}
              className="glass p-2 rounded-xl hover:glass-strong transition-all duration-300"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <h1 className="text-3xl font-light text-white">
              Create Workout Plan
            </h1>
            <div className="w-10" />
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  step === currentStep ? 'bg-white text-black' : 
                  step < currentStep ? 'bg-white/50 text-white' : 
                  'bg-white/20 text-white/50'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-1 mx-2 ${
                    step < currentStep ? 'bg-white/50' : 'bg-white/20'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-strong rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (currentStep > 1 && !planId) {
                setCurrentStep(currentStep - 1);
              } else {
                navigate(createPageUrl('Workouts'));
              }
            }}
            className="glass p-2 rounded-xl hover:glass-strong transition-all duration-300"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-3xl font-light text-white">
            {planId ? 'Edit Workout Plan' : 'Build Your Plan'}
          </h1>
          <div className="flex items-center gap-2">
            {historyIndex > 0 && (
              <button
                onClick={handleUndo}
                className="glass px-4 py-2 rounded-xl text-white text-sm hover:glass-strong transition-all duration-300"
              >
                Undo
              </button>
            )}
            {historyIndex < history.length - 1 && (
              <button
                onClick={handleRedo}
                className="glass px-4 py-2 rounded-xl text-white text-sm hover:glass-strong transition-all duration-300"
              >
                Redo
              </button>
            )}
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !planData.name || scheduledWorkouts.length === 0}
              className="glass px-6 py-3 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saveMutation.isPending ? 'Saving...' : 'Save Plan'}
            </button>
          </div>
        </div>
      </div>

      {renderStep3()}

      {/* Quick Edit Popover */}
      {selectedWorkout && (
        <WorkoutQuickEditPopover
          workout={selectedWorkout}
          workoutDate={selectedWorkoutDate}
          onClose={() => {
            setSelectedWorkout(null);
            setSelectedWorkoutDate(null);
          }}
          onUpdate={(updates) => {
            const index = scheduledWorkouts.findIndex(w => w === selectedWorkout);
            if (index !== -1) {
              handleUpdateWorkout(index, updates);
            }
          }}
          onRemove={() => {
            const index = scheduledWorkouts.findIndex(w => w === selectedWorkout);
            if (index !== -1) {
              handleRemoveWorkout(index);
            }
          }}
          onDuplicate={() => handleCopyWorkout(selectedWorkout)}
        />
      )}
    </div>
  );
}
