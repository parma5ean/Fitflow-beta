
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Send, CheckCircle, ArrowRight, X, Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

export default function AITrainer() {
  const [step, setStep] = useState('intro');
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentResponse, setCurrentResponse] = useState("");
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const queryClient = useQueryClient();

  const { data: recentCheckIns } = useQuery({
    queryKey: ['aiTrainerLogs'],
    queryFn: () => base44.entities.AITrainerLog.list('-created_date', 5),
    initialData: []
  });

  const generateQuestionsMutation = useMutation({
    mutationFn: async () => {
      const { data } = await base44.functions.invoke('aiTrainer', { action: 'generate_questions' });
      return data;
    },
    onSuccess: (data) => {
      setQuestions(data.questions);
      setStep('questions');
    }
  });

  const generatePlanMutation = useMutation({
    mutationFn: async (responses) => {
      const { data } = await base44.functions.invoke('aiTrainer', { 
        action: 'generate_plan',
        responses 
      });
      return data;
    },
    onSuccess: (data) => {
      setGeneratedPlan(data);
      setStep('results');
    }
  });

  const acceptPlanMutation = useMutation({
    mutationFn: async () => {
      const latestLog = recentCheckIns[0];
      
      // Update macro goals
      if (generatedPlan.suggested_macros) {
        await base44.auth.updateMe({
          macro_goals: generatedPlan.suggested_macros
        });
      }

      // Mark log as accepted
      if (latestLog) {
        await base44.entities.AITrainerLog.update(latestLog.id, { plan_accepted: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiTrainerLogs'] });
      alert('Macro goals accepted and updated!');
      // We don't reset state fully here as the user might want to import the plan
      // The state reset will happen if they also import or deny.
    }
  });

  const importPlanMutation = useMutation({
    mutationFn: async () => {
      const { data } = await base44.functions.invoke('aiTrainer', { 
        action: 'import_plan',
        responses: responses // Pass the current responses array
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workoutPlans'] });
      alert(`Plan imported successfully! Check your Workouts page.`);
      setStep('intro');
      setQuestions([]);
      setResponses([]);
      setCurrentQuestionIndex(0);
      setGeneratedPlan(null);
    }
  });

  const denyPlanMutation = useMutation({
    mutationFn: async () => {
      const latestLog = recentCheckIns[0];
      if (latestLog) {
        await base44.entities.AITrainerLog.update(latestLog.id, { plan_accepted: false });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiTrainerLogs'] });
      setStep('intro');
      setQuestions([]);
      setResponses([]);
      setCurrentQuestionIndex(0);
      setGeneratedPlan(null);
    }
  });

  const handleStartCheckIn = () => {
    generateQuestionsMutation.mutate();
  };

  const handleNextQuestion = () => {
    if (currentResponse.trim()) {
      const newResponses = [...responses, currentResponse];
      setResponses(newResponses);
      setCurrentResponse("");

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        generatePlanMutation.mutate(newResponses);
      }
    }
  };

  // Keep these handlers as they are, mutations are called directly in buttons now or will be updated
  const handleAcceptPlan = () => {
    acceptPlanMutation.mutate();
  };

  const handleDenyPlan = () => {
    denyPlanMutation.mutate();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-strong rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center gap-4">
          <Sparkles className="w-8 h-8 text-white" />
          <div>
            <h1 className="text-3xl md:text-4xl font-light text-white">AI Personal Trainer</h1>
            <p className="text-white/70 font-light">Your personalized fitness coach</p>
          </div>
        </div>
      </div>

      {step === 'intro' && (
        <div className="glass-strong rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <Sparkles className="w-16 h-16 text-white mx-auto opacity-70" />
          <div>
            <h2 className="text-2xl font-light text-white mb-3">Weekly Check-In</h2>
            <p className="text-white/70 font-light max-w-2xl mx-auto">
              Let's review your progress from the past week and create a personalized plan for the upcoming week. 
              Your AI trainer will ask you a few questions to understand how you're doing.
            </p>
          </div>

          {recentCheckIns.length > 0 && (
            <div className="glass rounded-2xl p-4 text-left">
              <p className="text-white/70 text-sm mb-2">Last Check-In</p>
              <p className="text-white font-light">
                {format(new Date(recentCheckIns[0].created_date), 'MMMM d, yyyy')}
              </p>
              {recentCheckIns[0].plan_accepted && (
                <div className="flex items-center gap-2 mt-2 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Plan Accepted</span>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleStartCheckIn}
            disabled={generateQuestionsMutation.isPending}
            className="glass px-8 py-4 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300 disabled:opacity-50"
          >
            {generateQuestionsMutation.isPending ? 'Preparing Questions...' : 'Start Weekly Check-In'}
          </button>
        </div>
      )}

      {step === 'questions' && (
        <div className="glass-strong rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-light text-white">
              Question {currentQuestionIndex + 1} of {questions.length}
            </h3>
            <div className="flex gap-1">
              {questions.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index <= currentQuestionIndex ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-6 mb-6">
            <p className="text-white font-light text-lg">{questions[currentQuestionIndex]}</p>
          </div>

          <div>
            <Textarea
              value={currentResponse}
              onChange={(e) => setCurrentResponse(e.target.value)}
              className="glass border-white/20 text-white placeholder:text-white/50 font-light min-h-[120px]"
              placeholder="Type your response..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleNextQuestion();
                }
              }}
            />
          </div>

          <button
            onClick={handleNextQuestion}
            disabled={!currentResponse.trim() || generatePlanMutation.isPending}
            className="w-full glass px-6 py-4 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {generatePlanMutation.isPending ? (
              'Generating Your Plan...'
            ) : currentQuestionIndex < questions.length - 1 ? (
              <>Next Question <ArrowRight className="w-5 h-5" /></>
            ) : (
              <>Generate My Plan <Send className="w-5 h-5" /></>
            )}
          </button>
        </div>
      )}

      {step === 'results' && generatedPlan && (
        <div className="space-y-6">
          <div className="glass-strong rounded-3xl p-8 shadow-2xl">
            <h3 className="text-2xl font-light text-white mb-4">Your Personalized Feedback</h3>
            <p className="text-white/90 font-light leading-relaxed whitespace-pre-line">
              {generatedPlan.feedback}
            </p>
          </div>

          {generatedPlan.workout_plan && (
            <div className="glass-strong rounded-3xl p-8 shadow-2xl">
              <h3 className="text-2xl font-light text-white mb-4">Suggested Workout Plan</h3>
              <div className="mb-4">
                <p className="text-white font-light text-lg">{generatedPlan.workout_plan.plan_name}</p>
                <p className="text-white/70 text-sm">{generatedPlan.workout_plan.experience_notes}</p>
              </div>

              {generatedPlan.workout_plan.injury_considerations && 
               generatedPlan.workout_plan.injury_considerations.length > 0 && (
                <div className="glass rounded-2xl p-4 mb-6">
                  <p className="text-white/90 font-light text-sm mb-2">Injury Considerations:</p>
                  <ul className="space-y-1">
                    {generatedPlan.workout_plan.injury_considerations.map((note, i) => (
                      <li key={i} className="text-white/70 text-sm">{note}</li>
                    ))}
                  </ul>
                </div>
              )}

              {generatedPlan.workout_plan.workouts && generatedPlan.workout_plan.workouts.length > 0 && (
                <div className="space-y-4">
                  {generatedPlan.workout_plan.workouts.map((workout, index) => (
                    <div key={index} className="glass rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-white font-light text-lg">{workout.day}</h4>
                        <span className="text-white/70 text-sm">{workout.name}</span>
                      </div>
                      
                      {workout.sections && workout.sections.length > 0 && (
                        <div className="space-y-4">
                          {workout.sections.map((section, sIdx) => (
                            <div key={sIdx}>
                              <p className="text-white/70 text-xs uppercase mb-2">{section.section_name.replace('_', ' ')}</p>
                              <div className="space-y-2">
                                {section.exercises.map((exercise, eIdx) => (
                                  <div key={eIdx} className="text-sm">
                                    <div className="flex items-start justify-between">
                                      <span className="text-white/90">{exercise.custom_name || exercise.exercise_name}</span>
                                    </div>
                                    {exercise.sets_data && exercise.sets_data.length > 0 && (
                                      <div className="text-white/70 text-xs mt-1 space-y-0.5">
                                        {exercise.sets_data.map((set, setIdx) => (
                                          <div key={setIdx}>
                                            Set {set.set_number}: {set.weight}kg × {set.reps} reps
                                            {set.rir !== null && set.rir !== undefined && ` (RIR ${set.rir})`}
                                          </div>
                                        ))}
                                        {exercise.rest_period_seconds && (
                                          <div className="text-white/50">Rest: {exercise.rest_period_seconds}s</div>
                                        )}
                                      </div>
                                    )}
                                    {exercise.notes_for_exercise && (
                                      <div className="text-white/50 text-xs mt-1 italic">{exercise.notes_for_exercise}</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {generatedPlan.suggested_macros && (
            <div className="glass-strong rounded-3xl p-8 shadow-2xl">
              <h3 className="text-2xl font-light text-white mb-4">Adjusted Macro Goals</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass rounded-xl p-4">
                  <p className="text-white/70 text-sm mb-1">Calories</p>
                  <p className="text-white text-2xl font-light">{generatedPlan.suggested_macros.calories || 0}</p>
                </div>
                <div className="glass rounded-xl p-4">
                  <p className="text-white/70 text-sm mb-1">Protein</p>
                  <p className="text-white text-2xl font-light">{generatedPlan.suggested_macros.protein || 0}g</p>
                </div>
                <div className="glass rounded-xl p-4">
                  <p className="text-white/70 text-sm mb-1">Carbs</p>
                  <p className="text-white text-2xl font-light">{generatedPlan.suggested_macros.carbs || 0}g</p>
                </div>
                <div className="glass rounded-xl p-4">
                  <p className="text-white/70 text-sm mb-1">Fats</p>
                  <p className="text-white text-2xl font-light">{generatedPlan.suggested_macros.fats || 0}g</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {generatedPlan.workout_plan && (
              <button
                onClick={() => importPlanMutation.mutate()}
                disabled={importPlanMutation.isPending}
                className="w-full glass px-8 py-4 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                {importPlanMutation.isPending ? 'Importing Plan...' : 'Import Plan to Workouts'}
              </button>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => denyPlanMutation.mutate()}
                disabled={denyPlanMutation.isPending}
                className="flex-1 glass px-8 py-4 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                {denyPlanMutation.isPending ? 'Processing...' : 'Deny Plan'}
              </button>
              {generatedPlan.suggested_macros && (
                <button
                  onClick={() => acceptPlanMutation.mutate()}
                  disabled={acceptPlanMutation.isPending}
                  className="flex-1 glass px-8 py-4 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  {acceptPlanMutation.isPending ? 'Accepting...' : 'Accept Macros'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
