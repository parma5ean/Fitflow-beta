import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, X, Dumbbell, Plus, Sparkles, User, Play } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CustomExerciseForm from "../components/workouts/CustomExerciseForm";

export default function ExerciseLibrary() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMuscle, setFilterMuscle] = useState("all");
  const [filterEquipment, setFilterEquipment] = useState("all");
  const [libraryFilter, setLibraryFilter] = useState("all"); // 'all', 'fitflow', 'custom'
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);

  const { data: exercises, isLoading } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => base44.entities.Exercise.list('name'),
    initialData: []
  });

  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMuscle = filterMuscle === "all" || ex.primary_muscle_group === filterMuscle;
    const matchesEquipment = filterEquipment === "all" || 
      (ex.equipment_needed && ex.equipment_needed.includes(filterEquipment));
    const matchesLibrary = 
      libraryFilter === "all" || 
      (libraryFilter === "fitflow" && !ex.is_custom) ||
      (libraryFilter === "custom" && ex.is_custom);
    
    return matchesSearch && matchesMuscle && matchesEquipment && matchesLibrary;
  });

  const fitflowCount = exercises.filter(e => !e.is_custom).length;
  const customCount = exercises.filter(e => e.is_custom).length;

  const handleCustomExerciseCreated = () => {
    setShowCustomForm(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-strong rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(createPageUrl('Programs'))}
              className="glass p-2 rounded-xl hover:glass-strong transition-all duration-300"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-3xl md:text-4xl font-light text-white">Exercise Library</h1>
              <p className="text-white/70">Browse and manage your exercises</p>
            </div>
          </div>
          <button
            onClick={() => setShowCustomForm(true)}
            className="glass px-6 py-3 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300 shadow-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Exercise
          </button>
        </div>
      </div>

      {/* Library Filter Tabs */}
      <div className="glass-strong rounded-3xl p-6 shadow-2xl">
        <div className="glass rounded-xl p-1 flex gap-1 mb-6">
          <button
            onClick={() => setLibraryFilter("all")}
            className={`flex-1 px-4 py-3 rounded-lg font-light transition-all duration-300 flex items-center justify-center gap-2 ${
              libraryFilter === "all" ? 'bg-white/10 text-white' : 'text-white/50'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span className="hidden sm:inline">All Exercises ({exercises.length})</span>
            <span className="sm:hidden">All ({exercises.length})</span>
          </button>
          <button
            onClick={() => setLibraryFilter("fitflow")}
            className={`flex-1 px-4 py-3 rounded-lg font-light transition-all duration-300 flex items-center justify-center gap-2 ${
              libraryFilter === "fitflow" ? 'bg-white/10 text-white' : 'text-white/50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">FitFlow Library ({fitflowCount})</span>
            <span className="sm:hidden">FitFlow ({fitflowCount})</span>
          </button>
          <button
            onClick={() => setLibraryFilter("custom")}
            className={`flex-1 px-4 py-3 rounded-lg font-light transition-all duration-300 flex items-center justify-center gap-2 ${
              libraryFilter === "custom" ? 'bg-white/10 text-white' : 'text-white/50'
            }`}
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">My Exercises ({customCount})</span>
            <span className="sm:hidden">Mine ({customCount})</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass border-white/20 text-white pl-10 font-light"
              placeholder="Search exercises..."
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <X className="w-4 h-4 text-white/50" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select value={filterMuscle} onValueChange={setFilterMuscle}>
              <SelectTrigger className="glass border-white/20 text-white font-light">
                <SelectValue placeholder="Muscle Group" />
              </SelectTrigger>
              <SelectContent className="glass-strong border-white/20">
                <SelectItem value="all" className="text-white hover:bg-white/10">All Muscles</SelectItem>
                <SelectItem value="Chest" className="text-white hover:bg-white/10">Chest</SelectItem>
                <SelectItem value="Back" className="text-white hover:bg-white/10">Back</SelectItem>
                <SelectItem value="Legs" className="text-white hover:bg-white/10">Legs</SelectItem>
                <SelectItem value="Shoulders" className="text-white hover:bg-white/10">Shoulders</SelectItem>
                <SelectItem value="Arms" className="text-white hover:bg-white/10">Arms</SelectItem>
                <SelectItem value="Core" className="text-white hover:bg-white/10">Core</SelectItem>
                <SelectItem value="Glutes" className="text-white hover:bg-white/10">Glutes</SelectItem>
                <SelectItem value="Calves" className="text-white hover:bg-white/10">Calves</SelectItem>
                <SelectItem value="Full Body" className="text-white hover:bg-white/10">Full Body</SelectItem>
                <SelectItem value="Cardio" className="text-white hover:bg-white/10">Cardio</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterEquipment} onValueChange={setFilterEquipment}>
              <SelectTrigger className="glass border-white/20 text-white font-light">
                <SelectValue placeholder="Equipment" />
              </SelectTrigger>
              <SelectContent className="glass-strong border-white/20">
                <SelectItem value="all" className="text-white hover:bg-white/10">All Equipment</SelectItem>
                <SelectItem value="Barbell" className="text-white hover:bg-white/10">Barbell</SelectItem>
                <SelectItem value="Dumbbells" className="text-white hover:bg-white/10">Dumbbells</SelectItem>
                <SelectItem value="Kettlebell" className="text-white hover:bg-white/10">Kettlebell</SelectItem>
                <SelectItem value="Resistance Bands" className="text-white hover:bg-white/10">Resistance Bands</SelectItem>
                <SelectItem value="Machine" className="text-white hover:bg-white/10">Machine</SelectItem>
                <SelectItem value="Bodyweight" className="text-white hover:bg-white/10">Bodyweight</SelectItem>
                <SelectItem value="Cable" className="text-white hover:bg-white/10">Cable</SelectItem>
                <SelectItem value="Pull-up Bar" className="text-white hover:bg-white/10">Pull-up Bar</SelectItem>
                <SelectItem value="No Equipment" className="text-white hover:bg-white/10">No Equipment</SelectItem>
                <SelectItem value="Cardio Machine" className="text-white hover:bg-white/10">Cardio Machine</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Exercise Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      ) : filteredExercises.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExercises.map((exercise) => (
            <div
              key={exercise.id}
              className="glass-strong rounded-3xl p-6 shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedExercise(exercise)}
            >
              {/* Exercise Media */}
              {exercise.video_url && (
                <div className="mb-4 rounded-xl overflow-hidden aspect-video bg-black/30">
                  {exercise.video_url.includes('youtube.com') || exercise.video_url.includes('youtu.be') ? (
                    <iframe
                      src={exercise.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={exercise.video_url}
                      className="w-full h-full object-cover"
                      controls
                    />
                  )}
                </div>
              )}
              {!exercise.video_url && exercise.image_url && (
                <div className="mb-4 rounded-xl overflow-hidden aspect-video">
                  <img
                    src={exercise.image_url}
                    alt={exercise.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Exercise Info */}
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-white font-light text-lg">{exercise.name}</h3>
                {exercise.is_custom && (
                  <span className="glass px-2 py-1 rounded-lg text-xs text-white/70 flex-shrink-0 ml-2">Custom</span>
                )}
              </div>

              <div className="space-y-2 text-sm text-white/70">
                <p>
                  <span className="text-white/90">{exercise.primary_muscle_group}</span>
                  {exercise.secondary_muscle_groups && exercise.secondary_muscle_groups.length > 0 && (
                    <span className="text-white/60"> + {exercise.secondary_muscle_groups.join(', ')}</span>
                  )}
                </p>
                
                {exercise.equipment_needed && exercise.equipment_needed.length > 0 && (
                  <p className="text-white/60">{exercise.equipment_needed.join(', ')}</p>
                )}

                <div className="flex gap-2 flex-wrap">
                  <span className="glass px-2 py-1 rounded text-xs">{exercise.exercise_type}</span>
                  <span className="glass px-2 py-1 rounded text-xs">{exercise.difficulty_level}</span>
                </div>

                {exercise.description && (
                  <p className="text-white/50 text-xs mt-2 line-clamp-3">{exercise.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-strong rounded-3xl p-12 text-center shadow-2xl">
          <Dumbbell className="w-16 h-16 text-white/30 mx-auto mb-6" />
          <h3 className="text-2xl font-light text-white mb-2">No Exercises Found</h3>
          <p className="text-white/70 mb-6">Try adjusting your filters or create a custom exercise</p>
          <button
            onClick={() => setShowCustomForm(true)}
            className="glass px-8 py-4 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            Create Custom Exercise
          </button>
        </div>
      )}

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedExercise(null)}
        >
          <div 
            className="glass-strong rounded-3xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-light text-white">{selectedExercise.name}</h2>
              <button
                onClick={() => setSelectedExercise(null)}
                className="glass p-2 rounded-xl hover:glass-strong transition-all duration-300"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Video/Image */}
            {selectedExercise.video_url && (
              <div className="mb-6 rounded-xl overflow-hidden aspect-video bg-black/30">
                {selectedExercise.video_url.includes('youtube.com') || selectedExercise.video_url.includes('youtu.be') ? (
                  <iframe
                    src={selectedExercise.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                    className="w-full h-full"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={selectedExercise.video_url}
                    className="w-full h-full object-cover"
                    controls
                    autoPlay
                  />
                )}
              </div>
            )}
            {!selectedExercise.video_url && selectedExercise.image_url && (
              <div className="mb-6 rounded-xl overflow-hidden">
                <img
                  src={selectedExercise.image_url}
                  alt={selectedExercise.name}
                  className="w-full object-cover"
                />
              </div>
            )}

            {/* Details */}
            <div className="space-y-4">
              <div className="glass rounded-2xl p-4">
                <h3 className="text-white font-light text-lg mb-2">Muscle Groups</h3>
                <p className="text-white/90">Primary: {selectedExercise.primary_muscle_group}</p>
                {selectedExercise.secondary_muscle_groups && selectedExercise.secondary_muscle_groups.length > 0 && (
                  <p className="text-white/70">Secondary: {selectedExercise.secondary_muscle_groups.join(', ')}</p>
                )}
              </div>

              {selectedExercise.equipment_needed && selectedExercise.equipment_needed.length > 0 && (
                <div className="glass rounded-2xl p-4">
                  <h3 className="text-white font-light text-lg mb-2">Equipment</h3>
                  <p className="text-white/90">{selectedExercise.equipment_needed.join(', ')}</p>
                </div>
              )}

              <div className="glass rounded-2xl p-4">
                <h3 className="text-white font-light text-lg mb-2">Exercise Type & Difficulty</h3>
                <div className="flex gap-2">
                  <span className="glass px-3 py-1 rounded-lg text-white/90">{selectedExercise.exercise_type}</span>
                  <span className="glass px-3 py-1 rounded-lg text-white/90">{selectedExercise.difficulty_level}</span>
                </div>
              </div>

              {selectedExercise.description && (
                <div className="glass rounded-2xl p-4">
                  <h3 className="text-white font-light text-lg mb-2">Instructions</h3>
                  <p className="text-white/90 whitespace-pre-line">{selectedExercise.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <CustomExerciseForm
        open={showCustomForm}
        onClose={() => setShowCustomForm(false)}
        onSuccess={handleCustomExerciseCreated}
      />
    </div>
  );
}