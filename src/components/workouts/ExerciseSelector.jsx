import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, Dumbbell, Plus, Sparkles, User } from "lucide-react";
import CustomExerciseForm from "./CustomExerciseForm";

export default function ExerciseSelector({ open, onClose, onSelect }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMuscle, setFilterMuscle] = useState("all");
  const [filterEquipment, setFilterEquipment] = useState("all");
  const [libraryFilter, setLibraryFilter] = useState("all"); // 'all', 'fitflow', 'custom'
  const [showCustomForm, setShowCustomForm] = useState(false);

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

  const handleSelect = (exercise) => {
    onSelect(exercise);
    setSearchTerm("");
    setFilterMuscle("all");
    setFilterEquipment("all");
    setLibraryFilter("all");
  };

  const handleCustomExerciseCreated = (newExercise) => {
    // Automatically select the newly created exercise
    handleSelect(newExercise);
  };

  const fitflowCount = exercises.filter(e => !e.is_custom).length;
  const customCount = exercises.filter(e => e.is_custom).length;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="glass-strong border-white/20 text-white max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light flex items-center justify-between">
              <span>Exercise Library</span>
              <button onClick={onClose} className="glass p-2 rounded-xl hover:glass-strong">
                <X className="w-5 h-5" />
              </button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Library Filter Tabs */}
            <div className="glass rounded-xl p-1 flex gap-1">
              <button
                onClick={() => setLibraryFilter("all")}
                className={`flex-1 px-4 py-2 rounded-lg font-light transition-all duration-300 flex items-center justify-center gap-2 ${
                  libraryFilter === "all" ? 'bg-white/10 text-white' : 'text-white/50'
                }`}
              >
                <Dumbbell className="w-4 h-4" />
                <span>All ({exercises.length})</span>
              </button>
              <button
                onClick={() => setLibraryFilter("fitflow")}
                className={`flex-1 px-4 py-2 rounded-lg font-light transition-all duration-300 flex items-center justify-center gap-2 ${
                  libraryFilter === "fitflow" ? 'bg-white/10 text-white' : 'text-white/50'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">FitFlow Library ({fitflowCount})</span>
                <span className="sm:hidden">FitFlow ({fitflowCount})</span>
              </button>
              <button
                onClick={() => setLibraryFilter("custom")}
                className={`flex-1 px-4 py-2 rounded-lg font-light transition-all duration-300 flex items-center justify-center gap-2 ${
                  libraryFilter === "custom" ? 'bg-white/10 text-white' : 'text-white/50'
                }`}
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">My Exercises ({customCount})</span>
                <span className="sm:hidden">Mine ({customCount})</span>
              </button>
            </div>

            {/* Create New Exercise Button */}
            <button
              onClick={() => setShowCustomForm(true)}
              className="w-full glass px-6 py-4 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Custom Exercise
            </button>

            {/* Search and Filters */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="glass border-white/20 text-white pl-10 font-light"
                  placeholder="Search exercises..."
                />
              </div>
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

            {/* Exercise List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              ) : filteredExercises.length > 0 ? (
                filteredExercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    onClick={() => handleSelect(exercise)}
                    className="w-full glass rounded-xl p-4 text-left hover:glass-strong transition-all duration-300"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-light">{exercise.name}</p>
                          {exercise.is_custom && (
                            <span className="glass px-2 py-0.5 rounded text-xs text-white/70">Custom</span>
                          )}
                        </div>
                        <p className="text-white/70 text-sm mt-1">
                          {exercise.primary_muscle_group}
                          {exercise.equipment_needed && exercise.equipment_needed.length > 0 && 
                            ` • ${exercise.equipment_needed.join(', ')}`
                          }
                        </p>
                        {exercise.description && (
                          <p className="text-white/50 text-xs mt-2 line-clamp-2">{exercise.description}</p>
                        )}
                      </div>
                      <Dumbbell className="w-5 h-5 text-white/50 ml-3 flex-shrink-0" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-12">
                  <Dumbbell className="w-12 h-12 text-white/30 mx-auto mb-4" />
                  <p className="text-white/70">No exercises found</p>
                  <p className="text-white/50 text-sm mt-2">Try adjusting your filters or create a custom exercise</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CustomExerciseForm
        open={showCustomForm}
        onClose={() => setShowCustomForm(false)}
        onSuccess={handleCustomExerciseCreated}
      />
    </>
  );
}