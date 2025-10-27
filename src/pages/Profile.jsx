import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { User, Save, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  convertWeightFromMetric, 
  convertWeightToMetric, 
  getWeightUnit,
  cmToFeetAndInches,
  feetAndInchesToCm,
  UNIT_SYSTEMS 
} from "@/components/utils/unitConversion";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    height: "",
    heightFeet: "",
    heightInches: "",
    current_weight: "",
    goal_weight: "",
    activity_level: "moderately_active",
    fitness_goal: "maintain",
    fitness_experience_level: "Beginner",
    previous_injuries: [],
    current_injuries: [],
    unit_system: "metric"
  });
  const [newPreviousInjury, setNewPreviousInjury] = useState("");
  const [newCurrentInjury, setNewCurrentInjury] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        
        const unitSystem = userData.unit_system || "metric";
        
        // Convert stored metric values to display values based on unit system
        const displayWeight = userData.current_weight 
          ? convertWeightFromMetric(userData.current_weight, unitSystem).toFixed(1)
          : "";
        const displayGoalWeight = userData.goal_weight 
          ? convertWeightFromMetric(userData.goal_weight, unitSystem).toFixed(1)
          : "";
        
        let heightData = {};
        if (userData.height) {
          if (unitSystem === UNIT_SYSTEMS.IMPERIAL) {
            const { feet, inches } = cmToFeetAndInches(userData.height);
            heightData = { heightFeet: feet.toString(), heightInches: inches.toString() };
          } else {
            heightData = { height: userData.height.toString() };
          }
        }
        
        setFormData({
          height: unitSystem === UNIT_SYSTEMS.METRIC ? (userData.height?.toString() || "") : "",
          heightFeet: heightData.heightFeet || "",
          heightInches: heightData.heightInches || "",
          current_weight: displayWeight,
          goal_weight: displayGoalWeight,
          activity_level: userData.activity_level || "moderately_active",
          fitness_goal: userData.fitness_goal || "maintain",
          fitness_experience_level: userData.fitness_experience_level || "Beginner",
          previous_injuries: userData.previous_injuries || [],
          current_injuries: userData.current_injuries || [],
          unit_system: unitSystem
        });
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      alert("Profile updated successfully");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert display values back to metric for storage
    const heightInCm = formData.unit_system === UNIT_SYSTEMS.IMPERIAL && formData.heightFeet
      ? feetAndInchesToCm(parseFloat(formData.heightFeet), parseFloat(formData.heightInches || 0))
      : parseFloat(formData.height);
    
    const currentWeightInKg = formData.current_weight
      ? convertWeightToMetric(parseFloat(formData.current_weight), formData.unit_system)
      : undefined;
    
    const goalWeightInKg = formData.goal_weight
      ? convertWeightToMetric(parseFloat(formData.goal_weight), formData.unit_system)
      : undefined;
    
    updateMutation.mutate({
      height: heightInCm || undefined,
      current_weight: currentWeightInKg,
      goal_weight: goalWeightInKg,
      activity_level: formData.activity_level,
      fitness_goal: formData.fitness_goal,
      fitness_experience_level: formData.fitness_experience_level,
      previous_injuries: formData.previous_injuries,
      current_injuries: formData.current_injuries,
      unit_system: formData.unit_system
    });
  };

  const handleUnitSystemChange = (checked) => {
    const newUnitSystem = checked ? UNIT_SYSTEMS.IMPERIAL : UNIT_SYSTEMS.METRIC;
    
    // Convert current values to new unit system
    let newFormData = { ...formData, unit_system: newUnitSystem };
    
    if (formData.current_weight) {
      const currentWeightInKg = convertWeightToMetric(parseFloat(formData.current_weight), formData.unit_system);
      newFormData.current_weight = convertWeightFromMetric(currentWeightInKg, newUnitSystem).toFixed(1);
    }
    
    if (formData.goal_weight) {
      const goalWeightInKg = convertWeightToMetric(parseFloat(formData.goal_weight), formData.unit_system);
      newFormData.goal_weight = convertWeightFromMetric(goalWeightInKg, newUnitSystem).toFixed(1);
    }
    
    // Handle height conversion
    if (newUnitSystem === UNIT_SYSTEMS.IMPERIAL && formData.height) {
      const { feet, inches } = cmToFeetAndInches(parseFloat(formData.height));
      newFormData.heightFeet = feet.toString();
      newFormData.heightInches = inches.toString();
      newFormData.height = "";
    } else if (newUnitSystem === UNIT_SYSTEMS.METRIC && formData.heightFeet) {
      const heightInCm = feetAndInchesToCm(parseFloat(formData.heightFeet), parseFloat(formData.heightInches || 0));
      newFormData.height = heightInCm.toFixed(0);
      newFormData.heightFeet = "";
      newFormData.heightInches = "";
    }
    
    setFormData(newFormData);
  };

  const addPreviousInjury = () => {
    if (newPreviousInjury.trim()) {
      setFormData({
        ...formData,
        previous_injuries: [...formData.previous_injuries, newPreviousInjury.trim()]
      });
      setNewPreviousInjury("");
    }
  };

  const removePreviousInjury = (index) => {
    setFormData({
      ...formData,
      previous_injuries: formData.previous_injuries.filter((_, i) => i !== index)
    });
  };

  const addCurrentInjury = () => {
    if (newCurrentInjury.trim()) {
      setFormData({
        ...formData,
        current_injuries: [...formData.current_injuries, newCurrentInjury.trim()]
      });
      setNewCurrentInjury("");
    }
  };

  const removeCurrentInjury = (index) => {
    setFormData({
      ...formData,
      current_injuries: formData.current_injuries.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-strong rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center gap-4">
          <User className="w-8 h-8 text-white" />
          <div>
            <h1 className="text-3xl md:text-4xl font-light text-white">Profile Settings</h1>
            <p className="text-white/70 font-light">Manage your personal information</p>
          </div>
        </div>
      </div>

      <div className="glass-strong rounded-3xl p-6 md:p-8 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-xl font-light text-white mb-4">Basic Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white/90 font-light">Full Name</Label>
                <Input
                  value={user?.full_name || ""}
                  disabled
                  className="glass border-white/20 text-white mt-1 font-light"
                />
              </div>
              <div>
                <Label className="text-white/90 font-light">Email</Label>
                <Input
                  value={user?.email || ""}
                  disabled
                  className="glass border-white/20 text-white mt-1 font-light"
                />
              </div>
            </div>
          </div>

          {/* Unit System Toggle */}
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white/90 font-light">Unit System</Label>
                <p className="text-white/60 text-sm mt-1">
                  {formData.unit_system === UNIT_SYSTEMS.METRIC ? 'Metric (kg, cm)' : 'Imperial (lbs, ft/in)'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm ${formData.unit_system === UNIT_SYSTEMS.METRIC ? 'text-white' : 'text-white/50'}`}>
                  Metric
                </span>
                <Switch
                  checked={formData.unit_system === UNIT_SYSTEMS.IMPERIAL}
                  onCheckedChange={handleUnitSystemChange}
                  className="data-[state=checked]:bg-white/30"
                />
                <span className={`text-sm ${formData.unit_system === UNIT_SYSTEMS.IMPERIAL ? 'text-white' : 'text-white/50'}`}>
                  Imperial
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-light text-white mb-4">Body Metrics</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {formData.unit_system === UNIT_SYSTEMS.METRIC ? (
                <div>
                  <Label className="text-white/90 font-light">Height (cm)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    className="glass border-white/20 text-white mt-1 font-light"
                    placeholder="175"
                  />
                </div>
              ) : (
                <div className="md:col-span-1 grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-white/90 font-light">Height (ft)</Label>
                    <Input
                      type="number"
                      value={formData.heightFeet}
                      onChange={(e) => setFormData({ ...formData, heightFeet: e.target.value })}
                      className="glass border-white/20 text-white mt-1 font-light"
                      placeholder="5"
                    />
                  </div>
                  <div>
                    <Label className="text-white/90 font-light">Inches</Label>
                    <Input
                      type="number"
                      value={formData.heightInches}
                      onChange={(e) => setFormData({ ...formData, heightInches: e.target.value })}
                      className="glass border-white/20 text-white mt-1 font-light"
                      placeholder="10"
                    />
                  </div>
                </div>
              )}
              <div>
                <Label className="text-white/90 font-light">
                  Current Weight ({getWeightUnit(formData.unit_system)})
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.current_weight}
                  onChange={(e) => setFormData({ ...formData, current_weight: e.target.value })}
                  className="glass border-white/20 text-white mt-1 font-light"
                  placeholder={formData.unit_system === UNIT_SYSTEMS.METRIC ? "70" : "154"}
                />
              </div>
              <div>
                <Label className="text-white/90 font-light">
                  Goal Weight ({getWeightUnit(formData.unit_system)})
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.goal_weight}
                  onChange={(e) => setFormData({ ...formData, goal_weight: e.target.value })}
                  className="glass border-white/20 text-white mt-1 font-light"
                  placeholder={formData.unit_system === UNIT_SYSTEMS.METRIC ? "65" : "143"}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-light text-white mb-4">Fitness Background</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label className="text-white/90 font-light">Experience Level</Label>
                <Select
                  value={formData.fitness_experience_level}
                  onValueChange={(value) => setFormData({ ...formData, fitness_experience_level: value })}
                >
                  <SelectTrigger className="glass border-white/20 text-white mt-1 font-light">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-strong border-white/20">
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/90 font-light">Activity Level</Label>
                <Select
                  value={formData.activity_level}
                  onValueChange={(value) => setFormData({ ...formData, activity_level: value })}
                >
                  <SelectTrigger className="glass border-white/20 text-white mt-1 font-light">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-strong border-white/20">
                    <SelectItem value="sedentary">Sedentary</SelectItem>
                    <SelectItem value="lightly_active">Lightly Active</SelectItem>
                    <SelectItem value="moderately_active">Moderately Active</SelectItem>
                    <SelectItem value="very_active">Very Active</SelectItem>
                    <SelectItem value="extremely_active">Extremely Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/90 font-light">Primary Goal</Label>
                <Select
                  value={formData.fitness_goal}
                  onValueChange={(value) => setFormData({ ...formData, fitness_goal: value })}
                >
                  <SelectTrigger className="glass border-white/20 text-white mt-1 font-light">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-strong border-white/20">
                    <SelectItem value="lose_weight">Lose Weight</SelectItem>
                    <SelectItem value="gain_muscle">Gain Muscle</SelectItem>
                    <SelectItem value="maintain">Maintain</SelectItem>
                    <SelectItem value="improve_endurance">Improve Endurance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-light text-white mb-4">Injury Information</h3>
            
            <div className="space-y-4">
              <div>
                <Label className="text-white/90 font-light">Previous Injuries</Label>
                <div className="mt-2 space-y-2">
                  {formData.previous_injuries.map((injury, index) => (
                    <div key={index} className="glass rounded-xl p-3 flex items-center justify-between">
                      <span className="text-white font-light">{injury}</span>
                      <button
                        type="button"
                        onClick={() => removePreviousInjury(index)}
                        className="text-white/70 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={newPreviousInjury}
                      onChange={(e) => setNewPreviousInjury(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPreviousInjury())}
                      className="glass border-white/20 text-white font-light"
                      placeholder="e.g., Left knee tendonitis"
                    />
                    <button
                      type="button"
                      onClick={addPreviousInjury}
                      className="glass px-4 py-2 rounded-xl text-white hover:glass-strong transition-all duration-300"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-white/90 font-light">Current Injuries</Label>
                <div className="mt-2 space-y-2">
                  {formData.current_injuries.map((injury, index) => (
                    <div key={index} className="glass rounded-xl p-3 flex items-center justify-between">
                      <span className="text-white font-light">{injury}</span>
                      <button
                        type="button"
                        onClick={() => removeCurrentInjury(index)}
                        className="text-white/70 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={newCurrentInjury}
                      onChange={(e) => setNewCurrentInjury(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCurrentInjury())}
                      className="glass border-white/20 text-white font-light"
                      placeholder="e.g., Lower back strain"
                    />
                    <button
                      type="button"
                      onClick={addCurrentInjury}
                      className="glass px-4 py-2 rounded-xl text-white hover:glass-strong transition-all duration-300"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="w-full glass px-6 py-4 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}