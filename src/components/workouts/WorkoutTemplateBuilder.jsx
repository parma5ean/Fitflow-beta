// ... keep existing code (imports) ...
import { 
  convertWeightToMetric, 
  convertWeightFromMetric, 
  getWeightUnit,
  convertDistanceToMeters,
  convertDistanceFromMeters,
  getDistanceUnit,
  getDefaultDistanceUnit,
  DISTANCE_UNITS,
  UNIT_SYSTEMS
} from "@/utils/unitConversion";

export default function WorkoutTemplateBuilder() {
  // ... keep existing code (state declarations) ...
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  // ... keep existing code until updateSetData function ...

  const updateSetData = (exerciseIndex, setIndex, field, value) => {
    const updated = { ...templateData };
    const set = updated.exercises[exerciseIndex].sets_data[setIndex];
    
    if (field === 'weight') {
      // Convert weight to metric for storage
      const unitSystem = user?.unit_system || UNIT_SYSTEMS.METRIC;
      set[field] = convertWeightToMetric(parseFloat(value) || 0, unitSystem);
    } else if (field === 'distance_meters') {
      // Convert distance to meters for storage
      const distanceUnit = set.distance_unit || getDefaultDistanceUnit(user?.unit_system || UNIT_SYSTEMS.METRIC);
      set[field] = convertDistanceToMeters(parseFloat(value) || 0, distanceUnit);
    } else {
      set[field] = value;
    }
    
    setTemplateData(updated);
  };

  const updateSetDistanceUnit = (exerciseIndex, setIndex, unit) => {
    const updated = { ...templateData };
    const set = updated.exercises[exerciseIndex].sets_data[setIndex];
    
    // Convert the current distance value to the new unit
    if (set.distance_meters) {
      const oldUnit = set.distance_unit || getDefaultDistanceUnit(user?.unit_system || UNIT_SYSTEMS.METRIC);
      const metersValue = convertDistanceToMeters(set.distance_meters, oldUnit);
      set.distance_meters = convertDistanceFromMeters(metersValue, unit);
    }
    
    set.distance_unit = unit;
    setTemplateData(updated);
  };

  // ... keep existing code until the render section with sets ...

  const unitSystem = user?.unit_system || UNIT_SYSTEMS.METRIC;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ... keep existing code (header and template details) ... */}

      {/* Exercises */}
      <div className="space-y-4">
        {/* ... keep existing code (header and drag context) ... */}
        
        {templateData.exercises.map((exercise, exerciseIndex) => (
          <Draggable key={exerciseIndex} draggableId={`exercise-${exerciseIndex}`} index={exerciseIndex}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                className="glass-strong rounded-3xl p-6 shadow-2xl space-y-4"
              >
                {/* ... keep existing code (exercise header) ... */}

                {/* Sets */}
                <div className="space-y-2">
                  {exercise.sets_data.map((set, setIndex) => {
                    const displayWeight = convertWeightFromMetric(set.weight || 0, unitSystem);
                    const distanceUnit = set.distance_unit || getDefaultDistanceUnit(unitSystem);
                    const displayDistance = set.distance_meters 
                      ? convertDistanceFromMeters(set.distance_meters, distanceUnit)
                      : "";
                    
                    return (
                      <div key={setIndex} className="flex items-center gap-2 flex-wrap">
                        <span className="text-white/70 text-sm w-12">Set {set.set_number}</span>
                        <Input
                          value={set.reps}
                          onChange={(e) => updateSetData(exerciseIndex, setIndex, 'reps', e.target.value)}
                          className="glass border-white/20 text-white text-sm font-light w-20"
                          placeholder="Reps"
                        />
                        <span className="text-white/70 text-sm">×</span>
                        <Input
                          type="number"
                          step="0.5"
                          value={displayWeight.toFixed(1)}
                          onChange={(e) => updateSetData(exerciseIndex, setIndex, 'weight', e.target.value)}
                          className="glass border-white/20 text-white text-sm font-light w-24"
                          placeholder="Weight"
                        />
                        <span className="text-white/70 text-sm">{getWeightUnit(unitSystem)}</span>
                        
                        {/* Distance input with unit selector */}
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            step="0.1"
                            value={displayDistance ? displayDistance.toFixed(2) : ""}
                            onChange={(e) => updateSetData(exerciseIndex, setIndex, 'distance_meters', e.target.value)}
                            className="glass border-white/20 text-white text-sm font-light w-24"
                            placeholder="Distance"
                          />
                          <Select
                            value={distanceUnit}
                            onValueChange={(value) => updateSetDistanceUnit(exerciseIndex, setIndex, value)}
                          >
                            <SelectTrigger className="glass border-white/20 text-white text-xs font-light w-20 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass-strong border-white/20">
                              <SelectItem value={DISTANCE_UNITS.METERS}>m</SelectItem>
                              <SelectItem value={DISTANCE_UNITS.MILES}>mi</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {setIndex > 0 && (
                          <button
                            onClick={() => removeSet(exerciseIndex, setIndex)}
                            className="text-white/50 hover:text-white"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {/* ... keep existing code (add set button) ... */}
                </div>

                {/* ... keep existing code (rest period and notes) ... */}
              </div>
            )}
          </Draggable>
        ))}
        
        {/* ... keep existing code (rest of exercises section) ... */}
      </div>

      {/* ... keep existing code (exercise selector) ... */}
    </div>
  );
}