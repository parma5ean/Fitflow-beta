
import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Clock, Info, CheckCircle2, Play, ChevronLeft, ChevronRight, X, Plus, Trash2, Dumbbell, ChevronDown, ChevronUp, StickyNote, TrendingUp, Zap, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import NumericKeypad from "../components/workouts/NumericKeypad";
import ScrollPicker from "../components/workouts/ScrollPicker";
import PostSetFeedback from "../components/workouts/PostSetFeedback";
import ExerciseNoteDialog from "../components/workouts/ExerciseNoteDialog";
import {
  convertWeightToMetric,
  convertWeightFromMetric,
  getWeightUnit,
  UNIT_SYSTEMS
} from "@/components/utils/unitConversion";

export default function WorkoutSession() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const workoutId = urlParams.get('workoutId');
  const activeSessionId = urlParams.get('activeSessionId');

  const [phase, setPhase] = useState('overview');
  const [workoutData, setWorkoutData] = useState(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [startTime, setStartTime] = useState(new Date());
  const [overallSecondsElapsed, setOverallSecondsElapsed] = useState(0);
  const [activeRestTimer, setActiveRestTimer] = useState(null);
  const [restSecondsRemaining, setRestSecondsRemaining] = useState(0);
  const [showExerciseDetails, setShowExerciseDetails] = useState(false);
  const [user, setUser] = useState(null);
  const [currentActiveSessionId, setCurrentActiveSessionId] = useState(activeSessionId);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  const [showLastPerformed, setShowLastPerformed] = useState(false);
  const [showVideoAndGuide, setShowVideoAndGuide] = useState(true);
  const [showPostSetFeedback, setShowPostSetFeedback] = useState(false);
  const [feedbackSetIndex, setFeedbackSetIndex] = useState(null);
  const [showExerciseNote, setShowExerciseNote] = useState(false);
  const [showSetNote, setShowSetNote] = useState(false);
  const [noteSetIndex, setNoteSetIndex] = useState(null);
  const [showWorkoutCompleteDialog, setShowWorkoutCompleteDialog] = useState(false);

  const [showWeightKeypad, setShowWeightKeypad] = useState(false);
  const [showRepsPicker, setShowRepsPicker] = useState(false);
  const [showRirPicker, setShowRirPicker] = useState(false);
  const [activeSetIndex, setActiveSetIndex] = useState(null);

  const exercisesContainerRef = useRef(null);
  const overallTimerIntervalRef = useRef(null);
  const autoSaveIntervalRef = useRef(null);
  const workoutInitialized = useRef(false);

  useEffect(() => {
    console.log('>>> Phase changed to:', phase);
  }, [phase]);

  useEffect(() => {
    if (phase === 'tracking') {
      console.log('>>> Setting workout mode to true');
      document.body.setAttribute('data-workout-mode', 'true');
    } else {
      console.log('>>> Removing workout mode');
      document.body.removeAttribute('data-workout-mode');
    }

    return () => {
      document.body.removeAttribute('data-workout-mode');
    };
  }, [phase]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        console.log('>>> User loaded:', userData?.email);
        setUser(userData);
      } catch (error) {
        console.error('>>> Error loading user:', error);
      }
    };
    loadUser();
  }, []);

  const unitSystem = user?.unit_system || UNIT_SYSTEMS.METRIC;

  const { data: workout, isLoading: isLoadingWorkout, error: workoutError } = useQuery({
    queryKey: ['workout', workoutId],
    queryFn: async () => {
      if (!workoutId) {
        console.log('>>> No workoutId provided');
        return null;
      }

      console.log('>>> Fetching workout with ID:', workoutId);
      const workouts = await base44.entities.Workout.filter({ id: workoutId });
      console.log('>>> Fetched workouts:', workouts);

      const workout = workouts[0] || null;

      if (!workout) {
        console.error('>>> Workout not found for ID:', workoutId);
        return null;
      }

      console.log('>>> Loaded workout from DB:', workout);

      if (workout && !workout.sections && workout.exercises) {
        console.log('>>> Converting legacy format');
        workout.sections = [{
          section_name: 'main',
          exercises: workout.exercises
        }];
        delete workout.exercises;
      }

      return workout;
    },
    enabled: !!workoutId,
    retry: 1
  });

  const { data: existingSession, isLoading: isLoadingExistingSession, error: sessionError } = useQuery({
    queryKey: ['activeSession', activeSessionId],
    queryFn: async () => {
      if (!activeSessionId) return null;

      console.log('>>> Fetching active session with ID:', activeSessionId);
      const sessions = await base44.entities.ActiveSession.filter({ id: activeSessionId });
      console.log('>>> Fetched sessions:', sessions);
      return sessions[0] || null;
    },
    enabled: !!activeSessionId,
    retry: 1
  });

  // Log any errors
  useEffect(() => {
    if (workoutError) {
      console.error('>>> Workout query error:', workoutError);
    }
    if (sessionError) {
      console.error('>>> Session query error:', sessionError);
    }
  }, [workoutError, sessionError]);

  useEffect(() => {
    if (workoutInitialized.current) {
      console.log('>>> Workout already initialized, skipping');
      return;
    }

    if (isLoadingWorkout || (activeSessionId && isLoadingExistingSession)) {
      console.log('>>> Still loading...');
      return;
    }

    if (workoutError) {
      console.error('>>> Cannot initialize workout due to error:', workoutError);
      setIsLoadingSession(false);
      return;
    }

    if (activeSessionId && existingSession && workout) {
      console.log('>>> Restoring existing session');
      const sessionData = existingSession.session_data;
      setWorkoutData(sessionData.workoutData);
      setCurrentSectionIndex(sessionData.currentSectionIndex || 0);
      setCurrentExerciseIndex(sessionData.currentExerciseIndex || 0);
      setOverallSecondsElapsed(sessionData.overallSecondsElapsed || 0);
      setActiveRestTimer(sessionData.activeRestTimer !== undefined ? sessionData.activeRestTimer : null);
      setRestSecondsRemaining(sessionData.restSecondsRemaining || 0);
      setStartTime(new Date(existingSession.start_time));
      setCurrentActiveSessionId(existingSession.id);
      setPhase('tracking');
      setIsLoadingSession(false);
      workoutInitialized.current = true;
    }
    else if (workout && !existingSession) {
      console.log('>>> Initializing new workout from:', workout.name);

      const copiedWorkout = JSON.parse(JSON.stringify(workout));

      if (!copiedWorkout.sections && copiedWorkout.exercises) {
        console.log('>>> Converting legacy exercises format to sections');
        copiedWorkout.sections = [{
          section_name: 'main',
          exercises: copiedWorkout.exercises
        }];
        delete copiedWorkout.exercises;
      }

      if (!copiedWorkout.sections || copiedWorkout.sections.length === 0) {
        console.log('>>> No sections found, creating default main section');
        copiedWorkout.sections = [{
          section_name: 'main',
          exercises: []
        }];
      }

      let totalExercises = 0;
      copiedWorkout.sections.forEach((section, sectionIdx) => {
        console.log(`>>> Section ${sectionIdx}:`, section.section_name, 'Exercises:', section.exercises?.length || 0);

        if (!section.exercises) {
          section.exercises = [];
        }

        section.exercises.forEach((exercise, exIdx) => {
          console.log(`>>>   Exercise ${exIdx}:`, exercise.custom_name || exercise.name, 'Sets:', exercise.sets_data?.length || 0);
          totalExercises++;

          if (!exercise.custom_name && exercise.name) {
            exercise.custom_name = exercise.name;
          }

          if (!exercise.sets_data || exercise.sets_data.length === 0) {
            console.log(`>>>     No sets_data found, creating default 3 sets`);
            exercise.sets_data = [
              { set_number: 1, reps: "10", weight: 0, completed: false, feedback: null, note: "" },
              { set_number: 2, reps: "10", weight: 0, completed: false, feedback: null, note: "" },
              { set_number: 3, reps: "10", weight: 0, completed: false, feedback: null, note: "" }
            ];
          } else {
            exercise.sets_data = exercise.sets_data.map((set, setIdx) => ({
              set_number: set.set_number || setIdx + 1,
              reps: set.reps || "10",
              weight: set.weight || 0,
              completed: set.completed || false,
              feedback: set.feedback || null,
              note: set.note || "",
              rpe: set.rpe || null,
              rir: set.rir || null
            }));
          }

          exercise.workout_notes = exercise.workout_notes || "";
          exercise.rest_period_seconds = exercise.rest_period_seconds || 90;
          exercise.is_superset = exercise.is_superset || false;
        });
      });

      console.log('>>> Workout initialized with', copiedWorkout.sections.length, 'sections and', totalExercises, 'total exercises');
      console.log('>>> Setting workoutData and phase to overview');
      setWorkoutData(copiedWorkout);
      setOverallSecondsElapsed(0);
      setStartTime(new Date());
      setPhase('overview');
      setIsLoadingSession(false);
      workoutInitialized.current = true;
      console.log('>>> Initialization complete');
    } else if (!workout && !isLoadingWorkout) {
      console.error('>>> No workout data available after loading');
      setIsLoadingSession(false);
    }
  }, [existingSession, workout, isLoadingWorkout, isLoadingExistingSession, activeSessionId, workoutError]);

  const { data: exerciseDetailsMap } = useQuery({
    queryKey: ['exerciseDetails', workout?.sections],
    queryFn: async () => {
      if (!workout?.sections) return {};

      const allExerciseIds = workout.sections
        .flatMap(section => section.exercises || [])
        .map(ex => ex.exercise_id)
        .filter(id => id);

      if (allExerciseIds.length === 0) return {};

      const exercises = await base44.entities.Exercise.filter({
        id: allExerciseIds
      });

      const exerciseMap = {};
      exercises.forEach(ex => {
        exerciseMap[ex.id] = ex;
      });

      return exerciseMap;
    },
    enabled: !!workout?.sections,
    retry: 1
  });

  const { data: lastPerformedData } = useQuery({
    queryKey: ['lastPerformed', workout?.sections],
    queryFn: async () => {
      if (!workout?.sections) return {};

      const allExerciseIds = workout.sections
        .flatMap(section => section.exercises || [])
        .map(ex => ex.exercise_id)
        .filter(id => id);

      if (allExerciseIds.length === 0) return {};

      const completedWorkouts = await base44.entities.Workout.filter({
        is_completed: true,
        created_by: user?.email
      });

      const lastPerformed = {};

      for (const exerciseId of allExerciseIds) {
        const performances = [];
        for (const completedWorkout of completedWorkouts.reverse()) {
          const allExercises = completedWorkout.sections
            ? completedWorkout.sections.flatMap(s => s.exercises || [])
            : completedWorkout.exercises || [];

          const exercise = allExercises.find(ex => ex.exercise_id === exerciseId);
          if (exercise && exercise.sets_data && exercise.sets_data.length > 0) {
            performances.push({
              date: completedWorkout.completed_date,
              sets: exercise.sets_data
            });
            if (performances.length >= 3) break;
          }
        }
        if (performances.length > 0) {
          lastPerformed[exerciseId] = performances;
        }
      }

      return lastPerformed;
    },
    enabled: !!workout?.sections && !!user,
    retry: 1
  });

  useEffect(() => {
    if (phase === 'tracking') {
      overallTimerIntervalRef.current = setInterval(() => {
        setOverallSecondsElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (overallTimerIntervalRef.current) {
        clearInterval(overallTimerIntervalRef.current);
      }
    }

    return () => {
      if (overallTimerIntervalRef.current) {
        clearInterval(overallTimerIntervalRef.current);
      }
    };
  }, [phase]);

  useEffect(() => {
    let interval;
    if (activeRestTimer !== null && restSecondsRemaining > 0) {
      interval = setInterval(() => {
        setRestSecondsRemaining(prev => {
          if (prev <= 1) {
            setActiveRestTimer(null);
            navigateExercise('next');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeRestTimer, restSecondsRemaining]);

  const saveSessionMutation = useMutation({
    mutationFn: async (sessionState) => {
      if (!user?.email || !workoutId) return;

      const dataToSave = {
        workout_id: workoutId,
        start_time: startTime.getTime(),
        last_saved_time: Date.now(),
        session_data: sessionState,
        workout_name: workout?.name || "Workout",
        created_by: user.email
      };

      if (currentActiveSessionId) {
        await base44.entities.ActiveSession.update(currentActiveSessionId, dataToSave);
      } else {
        const newSession = await base44.entities.ActiveSession.create(dataToSave);
        setCurrentActiveSessionId(newSession.id);
      }
    },
    onError: (error) => {
      console.error("Failed to auto-save session:", error);
    }
  });

  useEffect(() => {
    if (phase === 'tracking' && workoutData && workoutId && user && !isLoadingSession) {
      const sessionState = {
        workoutData,
        currentSectionIndex,
        currentExerciseIndex,
        overallSecondsElapsed,
        activeRestTimer,
        restSecondsRemaining
      };
      saveSessionMutation.mutate(sessionState);

      autoSaveIntervalRef.current = setInterval(() => {
        const sessionState = {
          workoutData,
          currentSectionIndex,
          currentExerciseIndex,
          overallSecondsElapsed,
          activeRestTimer,
          restSecondsRemaining
        };
        saveSessionMutation.mutate(sessionState);
      }, 30000);

      return () => {
        if (autoSaveIntervalRef.current) {
          clearInterval(autoSaveIntervalRef.current);
        }
      };
    }
  }, [
    phase, workoutData, currentSectionIndex, currentExerciseIndex,
    overallSecondsElapsed, activeRestTimer, restSecondsRemaining,
    workoutId, user, isLoadingSession
  ]);

  useEffect(() => {
    if (exercisesContainerRef.current && phase === 'tracking') {
      const exerciseElement = exercisesContainerRef.current.children[currentExerciseIndex];
      if (exerciseElement) {
        exerciseElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentExerciseIndex, phase]);

  const handleScroll = () => {
    if (exercisesContainerRef.current) {
      const container = exercisesContainerRef.current;
      const scrollLeft = container.scrollLeft;
      const itemWidth = container.children[0]?.offsetWidth || 0;

      if (itemWidth > 0) {
        const newIndex = Math.round(scrollLeft / itemWidth);
        if (newIndex !== currentExerciseIndex) {
          setCurrentExerciseIndex(newIndex);
        }
      }
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const duration = Math.round(overallSecondsElapsed / 60);
      await base44.entities.Workout.update(data.id, {
        is_completed: true,
        completed_date: format(new Date(), 'yyyy-MM-dd'),
        duration_minutes: duration,
        sections: data.sections
      });
      if (currentActiveSessionId) {
        await base44.entities.ActiveSession.delete(currentActiveSessionId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledWorkouts'] });
      queryClient.invalidateQueries({ queryKey: ['todayWorkouts'] });
      queryClient.invalidateQueries({ queryKey: ['activeSession'] });
      queryClient.invalidateQueries({ queryKey: ['activeSessions'] });
      navigate(createPageUrl('Dashboard'));
    }
  });

  const updateSetData = (sectionIndex, exerciseIndex, setIndex, field, value) => {
    const updated = { ...workoutData };
    updated.sections = [...updated.sections];
    updated.sections[sectionIndex] = { ...updated.sections[sectionIndex] };
    updated.sections[sectionIndex].exercises = [...updated.sections[sectionIndex].exercises];
    updated.sections[sectionIndex].exercises[exerciseIndex] = {
      ...updated.sections[sectionIndex].exercises[exerciseIndex]
    };
    updated.sections[sectionIndex].exercises[exerciseIndex].sets_data = [
      ...updated.sections[sectionIndex].exercises[exerciseIndex].sets_data
    ];

    const set = { ...updated.sections[sectionIndex].exercises[exerciseIndex].sets_data[setIndex] };

    if (field === 'weight') {
      set[field] = convertWeightToMetric(parseFloat(value) || 0, unitSystem);
    } else if (field === 'rpe' || field === 'rir') {
      set[field] = parseFloat(value) || null;
    } else if (field === 'reps') {
      set[field] = value;
    } else {
      set[field] = value;
    }

    updated.sections[sectionIndex].exercises[exerciseIndex].sets_data[setIndex] = set;
    setWorkoutData(updated);
  };

  const markSetComplete = (sectionIndex, exerciseIndex, setIndex) => {
    const updated = { ...workoutData };
    updated.sections = [...updated.sections];
    updated.sections[sectionIndex] = { ...updated.sections[sectionIndex] };
    updated.sections[sectionIndex].exercises = [...updated.sections[sectionIndex].exercises];
    updated.sections[sectionIndex].exercises[exerciseIndex] = {
      ...updated.sections[sectionIndex].exercises[exerciseIndex]
    };
    updated.sections[sectionIndex].exercises[exerciseIndex].sets_data = [
      ...updated.sections[sectionIndex].exercises[exerciseIndex].sets_data
    ];

    const set = { ...updated.sections[sectionIndex].exercises[exerciseIndex].sets_data[setIndex] };
    set.completed = !set.completed;

    updated.sections[sectionIndex].exercises[exerciseIndex].sets_data[setIndex] = set;
    setWorkoutData(updated);

    if (set.completed) {
      setFeedbackSetIndex(setIndex);
      setShowPostSetFeedback(true);

      const allSetsComplete = updated.sections[sectionIndex].exercises[exerciseIndex].sets_data.every(s => s.completed);
      const isLastSet = setIndex === updated.sections[sectionIndex].exercises[exerciseIndex].sets_data.length - 1;

      const isLastSection = sectionIndex === updated.sections.length - 1;
      const isLastExerciseInSection = exerciseIndex === updated.sections[sectionIndex].exercises.length - 1;
      const isVeryLastSet = isLastSection && isLastExerciseInSection && isLastSet;

      if (isVeryLastSet && allSetsComplete) {
        setTimeout(() => {
          setShowWorkoutCompleteDialog(true);
        }, 2000);
      } else if (allSetsComplete && isLastSet) {
        setTimeout(() => navigateExercise('next'), 1500);
      } else if (updated.sections[sectionIndex].exercises[exerciseIndex].rest_period_seconds) {
        setActiveRestTimer(setIndex);
        setRestSecondsRemaining(updated.sections[sectionIndex].exercises[exerciseIndex].rest_period_seconds);
      }
    } else {
      setActiveRestTimer(null);
      setRestSecondsRemaining(0);
    }
  };

  const handleSetFeedback = (feedback) => {
    if (feedbackSetIndex !== null) {
      updateSetData(currentSectionIndex, currentExerciseIndex, feedbackSetIndex, 'feedback', feedback);
    }
  };

  const handleExerciseNote = (note) => {
    const updated = { ...workoutData };
    if (updated.sections[currentSectionIndex] && updated.sections[currentSectionIndex].exercises[currentExerciseIndex]) {
      updated.sections[currentSectionIndex].exercises[currentExerciseIndex].workout_notes = note;
      setWorkoutData(updated);
    }
  };

  const handleSetNote = (note) => {
    if (noteSetIndex !== null) {
      updateSetData(currentSectionIndex, currentExerciseIndex, noteSetIndex, 'note', note);
    }
  };

  const prefillFromLastPerformance = () => {
    if (!workoutData || !workoutData.sections || !workoutData.sections[currentSectionIndex] || !workoutData.sections[currentSectionIndex].exercises[currentExerciseIndex]) {
      return;
    }
    const currentExercise = workoutData.sections[currentSectionIndex].exercises[currentExerciseIndex];
    const performances = lastPerformedData?.[currentExercise.exercise_id];

    if (performances && performances.length > 0) {
      const lastSession = performances[0];
      const updated = { ...workoutData };

      lastSession.sets.forEach((lastSet, index) => {
        if (updated.sections[currentSectionIndex].exercises[currentExerciseIndex].sets_data[index]) {
          updated.sections[currentSectionIndex].exercises[currentExerciseIndex].sets_data[index] = {
            ...updated.sections[currentSectionIndex].exercises[currentExerciseIndex].sets_data[index],
            weight: lastSet.weight,
            reps: lastSet.reps,
            rir: lastSet.rir
          };
        }
      });

      setWorkoutData(updated);
    }
  };

  const quickAdjustWeight = (setIndex, delta) => {
    if (!workoutData || !workoutData.sections || !workoutData.sections[currentSectionIndex] || !workoutData.sections[currentSectionIndex].exercises[currentExerciseIndex]) {
      return;
    }
    const currentSet = workoutData.sections[currentSectionIndex].exercises[currentExerciseIndex].sets_data[setIndex];
    const currentWeight = convertWeightFromMetric(currentSet.weight || 0, unitSystem);
    const newWeight = Math.max(0, currentWeight + delta);
    updateSetData(currentSectionIndex, currentExerciseIndex, setIndex, 'weight', newWeight.toString());
  };

  const quickAdjustReps = (setIndex, delta) => {
    if (!workoutData || !workoutData.sections || !workoutData.sections[currentSectionIndex] || !workoutData.sections[currentSectionIndex].exercises[currentExerciseIndex]) {
      return;
    }
    const currentSet = workoutData.sections[currentSectionIndex].exercises[currentExerciseIndex].sets_data[setIndex];
    const currentReps = parseInt(currentSet.reps) || 0;
    const newReps = Math.max(0, currentReps + delta);
    updateSetData(currentSectionIndex, currentExerciseIndex, setIndex, 'reps', newReps.toString());
  };

  const calculate1RM = (weight, reps) => {
    if (!weight || !reps || reps < 1) return 0;
    return weight * (1 + reps / 30);
  };

  const calculateVolume = (exercise) => {
    if (!exercise || !exercise.sets_data) return 0;
    return exercise.sets_data.reduce((total, set) => {
      if (set.completed) {
        return total + (set.weight || 0) * (parseInt(set.reps) || 0);
      }
      return total;
    }, 0);
  };

  const addSet = (sectionIndex, exerciseIndex) => {
    const updated = { ...workoutData };
    if (!updated.sections[sectionIndex] || !updated.sections[sectionIndex].exercises[exerciseIndex]) {
      return;
    }
    const exercise = updated.sections[sectionIndex].exercises[exerciseIndex];
    const lastSet = exercise.sets_data[exercise.sets_data.length - 1];

    exercise.sets_data.push({
      set_number: exercise.sets_data.length + 1,
      reps: lastSet?.reps || "10",
      weight: lastSet?.weight || 0,
      rpe: lastSet?.rpe || null,
      rir: lastSet?.rir || null,
      completed: false,
      feedback: null,
      note: ""
    });

    setWorkoutData(updated);
  };

  const removeSet = (sectionIndex, exerciseIndex, setIndex) => {
    const updated = { ...workoutData };
    if (!updated.sections[sectionIndex] || !updated.sections[sectionIndex].exercises[exerciseIndex]) {
      return;
    }
    updated.sections[sectionIndex].exercises[exerciseIndex].sets_data =
      updated.sections[sectionIndex].exercises[exerciseIndex].sets_data.filter((_, i) => i !== setIndex);
    updated.sections[sectionIndex].exercises[exerciseIndex].sets_data.forEach((set, i) => {
      set.set_number = i + 1;
    });
    setWorkoutData(updated);
  };

  const skipRest = () => {
    setActiveRestTimer(null);
    setRestSecondsRemaining(0);
  };

  const handleComplete = () => {
    if (confirm('Complete this workout?')) {
      saveMutation.mutate(workoutData);
    }
  };

  const handleCompleteFromDialog = () => {
    setShowWorkoutCompleteDialog(false);
    handleComplete();
  };

  const handleExitWorkout = () => {
    if (confirm('Exit workout? Your progress will be saved and you can continue later.')) {
      const sessionState = {
        workoutData,
        currentSectionIndex,
        currentExerciseIndex,
        overallSecondsElapsed,
        activeRestTimer,
        restSecondsRemaining
      };
      saveSessionMutation.mutate(sessionState);

      navigate(createPageUrl('Dashboard'));
    }
  };

  const navigateExercise = (direction) => {
    if (!workoutData || !workoutData.sections || !workoutData.sections[currentSectionIndex] || !workoutData.sections[currentSectionIndex].exercises) {
      console.warn("Cannot navigate: workout data structure is incomplete.");
      return;
    }

    const currentSectionExercises = workoutData.sections[currentSectionIndex].exercises;
    let newExerciseIndex = currentExerciseIndex;
    let newSectionIndex = currentSectionIndex;

    if (direction === 'next') {
      if (currentExerciseIndex < currentSectionExercises.length - 1) {
        newExerciseIndex++;
      } else if (currentSectionIndex < workoutData.sections.length - 1) {
        newSectionIndex++;
        newExerciseIndex = 0;
      } else {
        return;
      }
    } else {
      if (currentExerciseIndex > 0) {
        newExerciseIndex--;
      } else if (currentSectionIndex > 0) {
        newSectionIndex--;
        const prevSectionExercises = workoutData.sections[newSectionIndex]?.exercises;
        newExerciseIndex = prevSectionExercises ? prevSectionExercises.length - 1 : 0;
      } else {
        return;
      }
    }

    if (newSectionIndex !== currentSectionIndex || newExerciseIndex !== currentExerciseIndex) {
      setCurrentSectionIndex(newSectionIndex);
      setCurrentExerciseIndex(newExerciseIndex);
      setActiveRestTimer(null);
      setRestSecondsRemaining(0);
    }
  };

  const formatRestTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatOverallTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSectionDisplayName = (sectionName) => {
    const names = {
      'warm_up': 'Warm Up',
      'main': 'Main Workout',
      'cooldown': 'Cool Down'
    };
    return names[sectionName] || sectionName;
  };

  const getTotalExercisesCompleted = () => {
    let completed = 0;
    let total = 0;

    if (!workoutData || !workoutData.sections) return { completed: 0, total: 0 };

    workoutData.sections.forEach(section => {
      if (!section.exercises) return;
      section.exercises.forEach(exercise => {
        total++;
        if (!exercise.sets_data || exercise.sets_data.length === 0) return;
        const allSetsComplete = exercise.sets_data.every(set => set.completed);
        if (allSetsComplete) {
          completed++;
        }
      });
    });

    return { completed, total };
  };

  const openWeightKeypad = (setIndex) => {
    setActiveSetIndex(setIndex);
    setShowWeightKeypad(true);
  };

  const openRepsPicker = (setIndex) => {
    setActiveSetIndex(setIndex);
    setShowRepsPicker(true);
  };

  const openRirPicker = (setIndex) => {
    setActiveSetIndex(setIndex);
    setShowRirPicker(true);
  };

  const openExerciseNote = () => {
    setShowExerciseNote(true);
  };

  const openSetNote = (setIndex) => {
    setNoteSetIndex(setIndex);
    setShowSetNote(true);
  };

  console.log('>>> Rendering component - Current phase:', phase);
  console.log('>>> workoutData exists:', !!workoutData);
  console.log('>>> isLoadingWorkout:', isLoadingWorkout);
  console.log('>>> isLoadingSession:', isLoadingSession);
  console.log('>>> workoutError:', workoutError);

  if (!workoutId) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="glass-strong rounded-3xl p-8 text-center shadow-2xl">
          <AlertCircle className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <p className="text-white/70 mb-4">No workout selected</p>
          <button
            onClick={() => navigate(createPageUrl('Dashboard'))}
            className="glass px-6 py-3 rounded-xl text-white hover:glass-strong transition-all duration-300"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (workoutError) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="glass-strong rounded-3xl p-8 text-center shadow-2xl">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-light text-white mb-2">Error Loading Workout</h2>
          <p className="text-white/70 mb-4">
            {workoutError.message || 'Unable to load workout data'}
          </p>
          <div className="glass rounded-xl p-4 mb-6 text-left">
            <p className="text-white/70 text-sm mb-2">Workout ID: {workoutId}</p>
            <p className="text-white/50 text-xs">
              This workout may not exist or you may not have permission to access it.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate(createPageUrl('Dashboard'))}
              className="glass px-6 py-3 rounded-xl text-white hover:glass-strong transition-all duration-300"
            >
              Return to Dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="glass px-6 py-3 rounded-xl text-white hover:glass-strong transition-all duration-300"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingWorkout || (activeSessionId && isLoadingExistingSession) || isLoadingSession) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="text-white/70 mt-4">Loading workout...</p>
        </div>
      </div>
    );
  }

  console.log('>>> After loading checks - phase:', phase);

  if (phase === 'overview') {
    console.log('>>> Rendering overview phase');

    if (!workoutData) {
      return (
        <div className="max-w-4xl mx-auto p-6">
          <div className="glass-strong rounded-3xl p-8 text-center shadow-2xl">
            <AlertCircle className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <p className="text-white/70 mb-4">Workout data is not loaded.</p>
            <button
              onClick={() => navigate(createPageUrl('Dashboard'))}
              className="glass px-6 py-3 rounded-xl text-white hover:glass-strong transition-all duration-300"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }

    if (!workoutData.sections || workoutData.sections.length === 0) {
      return (
        <div className="max-w-4xl mx-auto p-6">
          <div className="glass-strong rounded-3xl p-8 text-center shadow-2xl">
            <AlertCircle className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <p className="text-white/70 mb-4">This workout has no sections or exercises.</p>
            <p className="text-white/50 text-sm mb-4">Please edit this workout and add some exercises.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate(createPageUrl('Dashboard'))}
                className="glass px-6 py-3 rounded-xl text-white hover:glass-strong transition-all duration-300"
              >
                Return to Dashboard
              </button>
              <button
                onClick={() => navigate(createPageUrl('CalendarPlanBuilder') + `?workoutId=${workoutId}`)}
                className="glass px-6 py-3 rounded-xl text-white hover:glass-strong transition-all duration-300"
              >
                Edit Workout
              </button>
            </div>
          </div>
        </div>
      );
    }

    const totalExercises = workoutData.sections.reduce((sum, section) => {
      return sum + (section.exercises?.length || 0);
    }, 0);

    if (totalExercises === 0) {
      return (
        <div className="max-w-4xl mx-auto p-6">
          <div className="glass-strong rounded-3xl p-8 text-center shadow-2xl">
            <AlertCircle className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <p className="text-white/70 mb-4">This workout has no exercises.</p>
            <p className="text-white/50 text-sm mb-4">Add some exercises to this workout to get started.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate(createPageUrl('Dashboard'))}
                className="glass px-6 py-3 rounded-xl text-white hover:glass-strong transition-all duration-300"
              >
                Return to Dashboard
              </button>
              <button
                onClick={() => navigate(createPageUrl('CalendarPlanBuilder') + `?workoutId=${workoutId}`)}
                className="glass px-6 py-3 rounded-xl text-white hover:glass-strong transition-all duration-300"
              >
                Edit Workout
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto space-y-6 p-6">
        <div className="glass-strong rounded-3xl p-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(createPageUrl('Dashboard'))}
              className="glass p-2 rounded-xl hover:glass-strong transition-all duration-300"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <h1 className="text-2xl md:text-3xl font-light text-white">{workoutData.name}</h1>
            <div className="w-10" />
          </div>
        </div>

        {workoutData.sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="glass-strong rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-light text-white mb-4">{getSectionDisplayName(section.section_name)}</h2>
            <div className="space-y-3">
              {section.exercises && section.exercises.map((exercise, exerciseIndex) => (
                <div key={exerciseIndex} className="glass rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-white font-light">{exercise.custom_name}</p>
                    {exercise.is_superset && (
                      <span className="glass px-2 py-1 rounded-lg text-xs text-white/70">SS</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {exercise.sets_data?.map((set, setIndex) => (
                      <div key={setIndex} className="flex items-center justify-between text-sm text-white/70">
                        <span>Set {set.set_number}</span>
                        <span>
                          {set.weight ? `${convertWeightFromMetric(set.weight, unitSystem).toFixed(1)} ${getWeightUnit(unitSystem)}` : '-'} × {set.reps} reps
                          {set.rpe && ` @ RPE ${set.rpe}`}
                          {set.rir !== null && set.rir !== undefined && ` (RIR ${set.rir})`}
                        </span>
                      </div>
                    ))}
                  </div>
                  {exercise.rest_period_seconds && (
                    <p className="text-white/50 text-xs mt-2">Rest: {exercise.rest_period_seconds}s</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={() => {
            console.log('>>> Let\'s get to Work button clicked!');
            console.log('>>> Current phase before change:', phase);
            console.log('>>> Setting phase to tracking...');
            setPhase('tracking');
            console.log('>>> Phase change requested');
          }}
          className="w-full glass px-6 py-4 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300 flex items-center justify-center gap-2 text-lg"
        >
          <Play className="w-6 h-6" />
          Let's get to Work!
        </button>
      </div>
    );
  }

  console.log('>>> Rendering tracking phase');

  // Safety checks for tracking phase
  if (!workoutData || !workoutData.sections || workoutData.sections.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="glass-strong rounded-3xl p-8 text-center shadow-2xl">
          <p className="text-white/70 mb-4">Invalid workout structure</p>
          <button
            onClick={() => navigate(createPageUrl('Dashboard'))}
            className="glass px-6 py-3 rounded-xl text-white hover:glass-strong transition-all duration-300"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentSection = workoutData.sections[currentSectionIndex];

  if (!currentSection) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="glass-strong rounded-3xl p-8 text-center shadow-2xl">
          <p className="text-white/70 mb-4">Current section not found</p>
          <button
            onClick={() => navigate(createPageUrl('Dashboard'))}
            className="glass px-6 py-3 rounded-xl text-white hover:glass-strong transition-all duration-300"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!currentSection.exercises || currentSection.exercises.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="glass-strong rounded-3xl p-8 text-center shadow-2xl">
          <p className="text-white/70 mb-4">No exercises in this section</p>
          <button
            onClick={() => navigate(createPageUrl('Dashboard'))}
            className="glass px-6 py-3 rounded-xl text-white hover:glass-strong transition-all duration-300"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const allExercisesInCurrentSection = currentSection.exercises;
  const currentExercise = allExercisesInCurrentSection[currentExerciseIndex];
  const currentExerciseDetails = exerciseDetailsMap?.[currentExercise.exercise_id];
  const performances = lastPerformedData?.[currentExercise.exercise_id];
  const lastPerformed = performances && performances.length > 0 ? performances[0] : null;

  const totalSections = workoutData.sections.length;
  const totalExercisesInSection = allExercisesInCurrentSection.length;
  const isLastExerciseOverall = currentSectionIndex === totalSections - 1 && currentExerciseIndex === totalExercisesInSection - 1;

  const { completed: totalCompleted, total: totalExercises } = getTotalExercisesCompleted();
  const overallProgress = totalExercises > 0 ? (totalCompleted / totalExercises) * 100 : 0;
  const exerciseVolume = calculateVolume(currentExercise);

  const nextExerciseIndex = currentExerciseIndex + 1;
  const hasNextExercise = nextExerciseIndex < allExercisesInCurrentSection.length;
  const nextExercise = hasNextExercise ? allExercisesInCurrentSection[nextExerciseIndex] : null;
  const isNextExerciseSuperset = nextExercise?.is_superset;

  return (
    <div className="min-h-screen flex flex-col pb-24 md:pb-8">
      {/* Header */}
      <div className="glass-strong p-4 shadow-2xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto space-y-2">
          <div className="flex items-center justify-between">
            <button
              onClick={handleExitWorkout}
              className="glass p-2 rounded-xl hover:glass-strong transition-all duration-300"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <div className="text-center flex-1">
              <p className="text-white font-light">{workoutData.name}</p>
              <p className="text-white/70 text-sm">
                {getSectionDisplayName(currentSection.section_name)} ({currentExerciseIndex + 1} of {totalExercisesInSection})
              </p>
              <div className="flex items-center justify-center gap-2 mt-1">
                <Clock className="w-4 h-4 text-white/70" />
                <p className="text-white/90 text-sm font-light">
                  {formatOverallTime(overallSecondsElapsed)}
                </p>
              </div>
            </div>
            <button
              onClick={handleComplete}
              disabled={saveMutation.isPending}
              className="glass px-4 py-2 rounded-xl text-white hover:glass-strong transition-all duration-300 disabled:opacity-50 text-sm"
            >
              {saveMutation.isPending ? 'Saving...' : 'Complete'}
            </button>
          </div>

          {/* Overall Progress Bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/70 rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <span className="text-white/70 text-xs font-light whitespace-nowrap">
              {totalCompleted}/{totalExercises}
            </span>
          </div>
        </div>
      </div>

      {/* Rest Timer */}
      {activeRestTimer !== null && restSecondsRemaining > 0 && (
        <div className="glass-strong p-4 shadow-xl">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-white" />
              <div>
                <p className="text-white/70 text-sm">Rest Timer</p>
                <p className="text-white text-lg font-light">{formatRestTime(restSecondsRemaining)}</p>
              </div>
            </div>
            <button
              onClick={skipRest}
              className="glass px-4 py-2 rounded-xl text-white hover:glass-strong transition-all duration-300"
            >
              Skip Rest
            </button>
          </div>
        </div>
      )}

      {/* Superset Indicator */}
      {isNextExerciseSuperset && (
        <div className="glass-strong p-3 shadow-xl">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <p className="text-white/90 text-sm">Superset Next: {nextExercise.custom_name}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 relative flex flex-col items-center">
        {/* Desktop Left Arrow */}
        <button
          onClick={() => navigateExercise('prev')}
          disabled={currentSectionIndex === 0 && currentExerciseIndex === 0}
          className="absolute left-0 top-1/2 -translate-y-1/2 glass p-3 rounded-full hover:glass-strong transition-all duration-300 disabled:opacity-30 z-20 hidden md:block ml-4"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>

        <div
          ref={exercisesContainerRef}
          className="flex-1 w-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth hide-scrollbar"
          onScroll={handleScroll}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {allExercisesInCurrentSection.map((exercise, exerciseIdx) => {
            const details = exerciseDetailsMap?.[exercise.exercise_id];
            const performed = lastPerformedData?.[exercise.exercise_id];
            const isCurrentExercise = exerciseIdx === currentExerciseIndex;

            return (
              <div
                key={exerciseIdx}
                className={`flex-shrink-0 w-full snap-start px-3 md:px-4 transition-all duration-300 ${
                  isCurrentExercise ? 'opacity-100' : 'opacity-50'
                }`}
                style={{ minWidth: '100%' }}
              >
                <div className="max-w-4xl mx-auto space-y-3 md:space-y-4">
                  {/* Video Section - Collapsible */}
                  {details?.video_url && (
                    <div className="glass-strong rounded-3xl overflow-hidden shadow-2xl">
                      <button
                        onClick={() => setShowVideoAndGuide(!showVideoAndGuide)}
                        className="w-full p-4 flex items-center justify-between text-white hover:glass transition-all duration-300"
                      >
                        <span className="font-light">Video & Form Guide</span>
                        {showVideoAndGuide ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>

                      {showVideoAndGuide && (
                        <div className="relative aspect-video">
                          <iframe
                            src={details.video_url}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                          <button
                            onClick={() => setShowExerciseDetails(true)}
                            className="absolute bottom-4 right-4 glass p-3 rounded-full hover:glass-strong transition-all duration-300"
                          >
                            <Info className="w-6 h-6 text-white" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Exercise Header */}
                  <div className={`glass-strong rounded-3xl p-4 md:p-6 shadow-2xl ${
                    isCurrentExercise ? 'ring-2 ring-white/30' : ''
                  } ${exercise.is_superset ? 'ring-2 ring-yellow-400/50' : ''}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h2 className="text-xl md:text-2xl font-light text-white">{exercise.custom_name}</h2>
                          {exercise.is_superset && (
                            <span className="glass px-2 py-1 rounded-lg text-xs text-yellow-400">Superset</span>
                          )}
                        </div>
                        {exerciseVolume > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <TrendingUp className="w-4 h-4 text-white/70" />
                            <span className="text-white/70 text-sm">
                              Volume: {convertWeightFromMetric(exerciseVolume, unitSystem).toFixed(0)} {getWeightUnit(unitSystem)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {!details?.video_url && (
                          <button
                            onClick={() => setShowExerciseDetails(true)}
                            className="glass p-2 rounded-xl hover:glass-strong transition-all duration-300"
                          >
                            <Info className="w-5 h-5 text-white" />
                          </button>
                        )}
                        <button
                          onClick={openExerciseNote}
                          className={`glass p-2 rounded-xl hover:glass-strong transition-all duration-300 relative ${
                            exercise.workout_notes ? 'ring-2 ring-white/30' : ''
                          }`}
                        >
                          <StickyNote className="w-5 h-5 text-white" />
                          {exercise.workout_notes && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Pre-fill Button */}
                    {performed && performed.length > 0 && (
                      <button
                        onClick={prefillFromLastPerformance}
                        className="w-full glass rounded-xl p-3 mb-3 text-white hover:glass-strong transition-all duration-300 text-sm font-light flex items-center justify-center gap-2"
                      >
                        <Zap className="w-4 h-4" />
                        Pre-fill from Last Performance
                      </button>
                    )}

                    {/* Last Performed - Collapsible */}
                    {performed && performed.length > 0 && (
                      <div className="glass rounded-xl mb-3">
                        <button
                          onClick={() => setShowLastPerformed(!showLastPerformed)}
                          className="w-full p-3 flex items-center justify-between text-white"
                        >
                          <span className="text-white/70 text-sm font-light">
                            Last: {convertWeightFromMetric(performed[0].sets[performed[0].sets.length - 1]?.weight || 0, unitSystem).toFixed(1)} {getWeightUnit(unitSystem)} × {performed[0].sets[performed[0].sets.length - 1]?.reps} reps
                          </span>
                          {showLastPerformed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {showLastPerformed && (
                          <div className="px-3 pb-3 space-y-2">
                            {performed.slice(0, 3).map((perf, idx) => (
                              <div key={idx} className="glass rounded-lg p-2">
                                <p className="text-white/50 text-xs mb-1">{perf.date}</p>
                                {perf.sets.map((set, setIdx) => (
                                  <p key={setIdx} className="text-white/80 text-xs">
                                    Set {setIdx + 1}: {convertWeightFromMetric(set.weight || 0, unitSystem).toFixed(1)} {getWeightUnit(unitSystem)} × {set.reps} reps
                                    {set.rir !== null && set.rir !== undefined && ` (RIR ${set.rir})`}
                                  </p>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Table Header */}
                    <div className="glass rounded-t-xl p-2 grid grid-cols-5 gap-1 text-center mb-2">
                      <div className="text-white/70 text-xs font-light">Set</div>
                      <div className="text-white/70 text-xs font-light">Weight</div>
                      <div className="text-white/70 text-xs font-light">Reps</div>
                      <div className="text-white/70 text-xs font-light">RIR</div>
                      <div className="text-white/70 text-xs font-light"></div>
                    </div>

                    {/* Sets Table */}
                    <div className="space-y-2">
                      {exercise.sets_data?.map((set, setIndex) => {
                        const displayWeight = convertWeightFromMetric(set.weight || 0, unitSystem);
                        const isResting = activeRestTimer === setIndex && restSecondsRemaining > 0;
                        const planned = exercise.sets_data[setIndex];
                        const estimated1RM = set.weight && set.reps ? calculate1RM(set.weight, parseInt(set.reps)) : 0;

                        return (
                          <div key={setIndex}>
                            <div
                              className={`glass rounded-xl p-2 transition-all duration-300 ${
                                isResting ? 'ring-2 ring-white/50' : ''
                              } ${set.completed ? 'bg-white/10' : ''}`}
                            >
                              <div className="grid grid-cols-5 gap-1 items-center">
                                {/* Set Number */}
                                <div className="text-white/90 text-sm font-light text-center">
                                  {set.set_number}
                                </div>

                                {/* Weight with +/- buttons */}
                                <div className="flex flex-col gap-0.5">
                                  <button
                                    onClick={() => openWeightKeypad(setIndex)}
                                    disabled={set.completed}
                                    className="glass rounded-lg p-1.5 text-white text-xs font-light text-center disabled:opacity-50"
                                  >
                                    {displayWeight > 0 ? displayWeight.toFixed(1) : '-'}
                                  </button>
                                  {!set.completed && (
                                    <div className="flex gap-0.5">
                                      <button
                                        onClick={() => quickAdjustWeight(setIndex, -2.5)}
                                        className="flex-1 glass rounded px-1 py-0.5 text-white/70 text-xs hover:glass-strong"
                                      >
                                        -
                                      </button>
                                      <button
                                        onClick={() => quickAdjustWeight(setIndex, 2.5)}
                                        className="flex-1 glass rounded px-1 py-0.5 text-white/70 text-xs hover:glass-strong"
                                      >
                                        +
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Reps with +/- buttons */}
                                <div className="flex flex-col gap-0.5">
                                  <button
                                    onClick={() => openRepsPicker(setIndex)}
                                    disabled={set.completed}
                                    className="glass rounded-lg p-1.5 text-white text-xs font-light text-center disabled:opacity-50"
                                  >
                                    {set.reps || '-'}
                                  </button>
                                  {!set.completed && (
                                    <div className="flex gap-0.5">
                                      <button
                                        onClick={() => quickAdjustReps(setIndex, -1)}
                                        className="flex-1 glass rounded px-1 py-0.5 text-white/70 text-xs hover:glass-strong"
                                      >
                                        -
                                      </button>
                                      <button
                                        onClick={() => quickAdjustReps(setIndex, 1)}
                                        className="flex-1 glass rounded px-1 py-0.5 text-white/70 text-xs hover:glass-strong"
                                      >
                                        +
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* RIR */}
                                <button
                                  onClick={() => openRirPicker(setIndex)}
                                  disabled={set.completed}
                                  className="glass rounded-lg p-1.5 text-white text-xs font-light text-center disabled:opacity-50"
                                >
                                  {set.rir !== null && set.rir !== undefined ? set.rir : '-'}
                                </button>

                                {/* Check Mark */}
                                <button
                                  onClick={() => markSetComplete(currentSectionIndex, exerciseIdx, setIndex)}
                                  className={`glass p-1.5 rounded-lg transition-all duration-300 mx-auto ${
                                    set.completed ? 'bg-white/20' : ''
                                  }`}
                                >
                                  {set.completed ? (
                                    <CheckCircle2 className="w-5 h-5 text-white" />
                                  ) : (
                                    <Check className="w-5 h-5 text-white/30" />
                                  )}
                                </button>
                              </div>

                              {/* Target vs Actual & 1RM */}
                              {set.completed && (
                                <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-xs flex-wrap gap-2">
                                  <div className="text-white/50">
                                    Target: {convertWeightFromMetric(planned.weight || 0, unitSystem).toFixed(1)} × {planned.reps}
                                  </div>
                                  {estimated1RM > 0 && (
                                    <div className="text-white/70">
                                      Est. 1RM: {convertWeightFromMetric(estimated1RM, unitSystem).toFixed(1)} {getWeightUnit(unitSystem)}
                                    </div>
                                  )}
                                  {set.feedback && (
                                    <div className="text-xl">
                                      {set.feedback === 'easy' && '😄'}
                                      {set.feedback === 'okay' && '🙂'}
                                      {set.feedback === 'hard' && '😬'}
                                      {set.feedback === 'max' && '🥵'}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Set Note */}
                              {set.note && (
                                <div className="mt-2 pt-2 border-t border-white/10">
                                  <p className="text-white/70 text-xs">{set.note}</p>
                                </div>
                              )}
                            </div>

                            {/* Remove Set and Note Buttons */}
                            <div className="flex items-center justify-between mt-1 px-2">
                              {exercise.sets_data.length > 1 && (
                                <button
                                  onClick={() => removeSet(currentSectionIndex, exerciseIdx, setIndex)}
                                  className="text-white/50 hover:text-white text-xs flex items-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Remove
                                </button>
                              )}
                              <button
                                onClick={() => openSetNote(setIndex)}
                                className={`text-white/50 hover:text-white text-xs flex items-center gap-1 ml-auto relative ${
                                  set.note ? 'text-white/90' : ''
                                }`}
                              >
                                <StickyNote className="w-3 h-3" />
                                {set.note ? 'Edit Note' : 'Add Note'}
                                {set.note && (
                                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => addSet(currentSectionIndex, exerciseIdx)}
                      className="w-full glass mt-3 px-4 py-3 rounded-xl text-white hover:glass-strong transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-sm font-light">Add Set</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Right Arrow */}
        <button
          onClick={() => navigateExercise('next')}
          disabled={isLastExerciseOverall}
          className="absolute right-0 top-1/2 -translate-y-1/2 glass p-3 rounded-full hover:glass-strong transition-all duration-300 disabled:opacity-30 z-20 hidden md:block mr-4"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>

        {/* Mobile Exercise Indicator */}
        <div className="w-full px-4 py-3 md:hidden">
          <div className="flex items-center justify-center gap-1 max-w-md mx-auto">
            {allExercisesInCurrentSection.map((ex, idx) => (
              <Dumbbell
                key={idx}
                className={`w-2.5 h-2.5 transition-all duration-300 ${
                  idx === currentExerciseIndex
                    ? 'text-white scale-110'
                    : 'text-white/30 scale-100'
                } ${ex.is_superset ? 'text-yellow-400' : ''}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Input Modals */}
      {activeSetIndex !== null && currentExercise && currentExercise.sets_data && currentExercise.sets_data[activeSetIndex] && (
        <>
          <NumericKeypad
            open={showWeightKeypad}
            onClose={() => {
              setShowWeightKeypad(false);
              setActiveSetIndex(null);
            }}
            onSubmit={(value) => {
              updateSetData(currentSectionIndex, currentExerciseIndex, activeSetIndex, 'weight', value);
              setShowWeightKeypad(false);
              setActiveSetIndex(null);
            }}
            title="Enter Weight"
            currentValue={convertWeightFromMetric(currentExercise.sets_data[activeSetIndex]?.weight || 0, unitSystem).toFixed(1)}
            unit={getWeightUnit(unitSystem)}
          />

          <ScrollPicker
            open={showRepsPicker}
            onClose={() => {
              setShowRepsPicker(false);
              setActiveSetIndex(null);
            }}
            onSubmit={(value) => {
              updateSetData(currentSectionIndex, currentExerciseIndex, activeSetIndex, 'reps', value.toString());
              setShowRepsPicker(false);
              setActiveSetIndex(null);
            }}
            title="Select Reps"
            currentValue={parseInt(currentExercise.sets_data[activeSetIndex]?.reps) || 10}
            min={1}
            max={50}
            unit="reps"
          />

          <ScrollPicker
            open={showRirPicker}
            onClose={() => {
              setShowRirPicker(false);
              setActiveSetIndex(null);
            }}
            onSubmit={(value) => {
              updateSetData(currentSectionIndex, currentExerciseIndex, activeSetIndex, 'rir', value);
              setShowRirPicker(false);
              setActiveSetIndex(null);
            }}
            title="Select RIR"
            currentValue={currentExercise.sets_data[activeSetIndex]?.rir !== null && currentExercise.sets_data[activeSetIndex]?.rir !== undefined ? currentExercise.sets_data[activeSetIndex].rir : 5}
            min={0}
            max={10}
            unit="RIR"
          />
        </>
      )}

      {/* Post-Set Feedback Modal */}
      <PostSetFeedback
        open={showPostSetFeedback}
        onClose={() => setShowPostSetFeedback(false)}
        onFeedback={handleSetFeedback}
      />

      {/* Exercise Note Dialog */}
      {currentExercise && (
        <ExerciseNoteDialog
          open={showExerciseNote}
          onClose={() => setShowExerciseNote(false)}
          onSave={handleExerciseNote}
          currentNote={currentExercise.workout_notes}
          title="Exercise Notes"
        />
      )}

      {/* Set Note Dialog */}
      {noteSetIndex !== null && currentExercise && currentExercise.sets_data && currentExercise.sets_data[noteSetIndex] && (
        <ExerciseNoteDialog
          open={showSetNote}
          onClose={() => {
            setShowSetNote(false);
            setNoteSetIndex(null);
          }}
          onSave={handleSetNote}
          currentNote={currentExercise.sets_data[noteSetIndex]?.note}
          title={`Set ${currentExercise.sets_data[noteSetIndex]?.set_number} Note`}
        />
      )}

      {/* Workout Complete Dialog */}
      <Dialog open={showWorkoutCompleteDialog} onOpenChange={setShowWorkoutCompleteDialog}>
        <DialogContent className="glass-strong border-white/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light text-center">
              🎉 Workout Complete!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-center">
            <p className="text-white/90">
              Congratulations! You've completed all exercises.
            </p>

            <div className="glass rounded-2xl p-4">
              <p className="text-white/70 text-sm">Total Time</p>
              <p className="text-white text-2xl font-light">{formatOverallTime(overallSecondsElapsed)}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowWorkoutCompleteDialog(false)}
                className="flex-1 glass px-6 py-3 rounded-xl text-white font-light hover:glass-strong transition-all duration-300"
              >
                Back to Workout
              </button>
              <button
                onClick={handleCompleteFromDialog}
                className="flex-1 glass px-6 py-3 rounded-xl text-white font-light hover:glass-strong transition-all duration-300"
              >
                Finish & Save
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Exercise Details Dialog */}
      {currentExercise && (
        <Dialog open={showExerciseDetails} onOpenChange={setShowExerciseDetails}>
          <DialogContent className="glass-strong border-white/20 text-white max-w-2xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-light flex items-center justify-between">
                {currentExercise.custom_name}
                <button onClick={() => setShowExerciseDetails(false)} className="glass p-2 rounded-xl hover:glass-strong">
                  <X className="w-5 h-5" />
                </button>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {currentExerciseDetails?.description && (
                <div>
                  <h3 className="text-lg font-light text-white mb-2">Form Guide</h3>
                  <div className="glass rounded-xl p-4">
                    <p className="text-white/90 whitespace-pre-line">{currentExerciseDetails.description}</p>
                  </div>
                </div>
              )}

              {currentExercise.notes_for_exercise && (
                <div>
                  <h3 className="text-lg font-light text-white mb-2">Workout Notes</h3>
                  <div className="glass rounded-xl p-4">
                    <p className="text-white/90">{currentExercise.notes_for_exercise}</p>
                  </div>
                </div>
              )}

              {currentExercise.workout_notes && (
                <div>
                  <h3 className="text-lg font-light text-white mb-2">Your Notes</h3>
                  <div className="glass rounded-xl p-4">
                    <p className="text-white/90">{currentExercise.workout_notes}</p>
                  </div>
                </div>
              )}

              {currentExerciseDetails && (
                <div>
                  <h3 className="text-lg font-light text-white mb-2">Exercise Details</h3>
                  <div className="glass rounded-xl p-4 space-y-2">
                    <p className="text-white/70 text-sm">
                      <span className="text-white">Muscle Group:</span> {currentExerciseDetails.primary_muscle_group}
                    </p>
                    {currentExerciseDetails.equipment_needed && currentExerciseDetails.equipment_needed.length > 0 && (
                      <p className="text-white/70 text-sm">
                        <span className="text-white">Equipment:</span> {currentExerciseDetails.equipment_needed.join(', ')}
                      </p>
                    )}
                    <p className="text-white/70 text-sm">
                      <span className="text-white">Difficulty:</span> {currentExerciseDetails.difficulty_level}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
