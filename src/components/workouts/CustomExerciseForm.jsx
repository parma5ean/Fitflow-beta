import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Trash2, Upload, Link as LinkIcon, Video, Image as ImageIcon } from "lucide-react";

export default function CustomExerciseForm({ open, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    video_url: "",
    image_url: "",
    primary_muscle_group: "Chest",
    secondary_muscle_groups: [],
    equipment_needed: [],
    exercise_type: "Strength",
    difficulty_level: "Beginner"
  });

  const [newSecondaryMuscle, setNewSecondaryMuscle] = useState("");
  const [newEquipment, setNewEquipment] = useState("");
  const [uploadMode, setUploadMode] = useState("url"); // 'url' or 'file'
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFilePreview, setUploadedFilePreview] = useState(null);

  const createExerciseMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.Exercise.create({
        ...data,
        is_custom: true
      });
    },
    onSuccess: (newExercise) => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      if (onSuccess) onSuccess(newExercise);
      handleClose();
    }
  });

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      video_url: "",
      image_url: "",
      primary_muscle_group: "Chest",
      secondary_muscle_groups: [],
      equipment_needed: [],
      exercise_type: "Strength",
      difficulty_level: "Beginner"
    });
    setNewSecondaryMuscle("");
    setNewEquipment("");
    setUploadMode("url");
    setUploadedFilePreview(null);
    onClose();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      alert('Please upload a video or image file');
      return;
    }

    setIsUploading(true);
    
    try {
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedFilePreview({
          url: reader.result,
          type: isVideo ? 'video' : 'image'
        });
      };
      reader.readAsDataURL(file);

      // Upload to server
      const result = await base44.integrations.Core.UploadFile({ file });
      
      if (isVideo) {
        setFormData({ ...formData, video_url: result.file_url, image_url: "" });
      } else {
        setFormData({ ...formData, image_url: result.file_url, video_url: "" });
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Exercise name is required");
      return;
    }
    createExerciseMutation.mutate(formData);
  };

  const addSecondaryMuscle = () => {
    if (newSecondaryMuscle && !formData.secondary_muscle_groups.includes(newSecondaryMuscle)) {
      setFormData({
        ...formData,
        secondary_muscle_groups: [...formData.secondary_muscle_groups, newSecondaryMuscle]
      });
      setNewSecondaryMuscle("");
    }
  };

  const removeSecondaryMuscle = (muscle) => {
    setFormData({
      ...formData,
      secondary_muscle_groups: formData.secondary_muscle_groups.filter(m => m !== muscle)
    });
  };

  const addEquipment = () => {
    if (newEquipment && !formData.equipment_needed.includes(newEquipment)) {
      setFormData({
        ...formData,
        equipment_needed: [...formData.equipment_needed, newEquipment]
      });
      setNewEquipment("");
    }
  };

  const removeEquipment = (equipment) => {
    setFormData({
      ...formData,
      equipment_needed: formData.equipment_needed.filter(e => e !== equipment)
    });
  };

  const clearMedia = () => {
    setFormData({ ...formData, video_url: "", image_url: "" });
    setUploadedFilePreview(null);
  };

  const muscleGroups = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Glutes", "Calves", "Full Body", "Cardio"];
  const equipmentOptions = ["Barbell", "Dumbbells", "Kettlebell", "Resistance Bands", "Machine", "Bodyweight", "Cable", "Pull-up Bar", "No Equipment", "Cardio Machine"];

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="glass-strong border-white/20 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light flex items-center justify-between">
              Create Custom Exercise
              <button onClick={handleClose} className="glass p-2 rounded-xl hover:glass-strong">
                <X className="w-5 h-5" />
              </button>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Exercise Name */}
            <div>
              <Label className="text-white/90 font-light">Exercise Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="glass border-white/20 text-white mt-1 font-light"
                placeholder="e.g., Single Arm Cable Fly"
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label className="text-white/90 font-light">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="glass border-white/20 text-white mt-1 font-light"
                placeholder="Step-by-step instructions on how to perform this exercise..."
                rows={4}
              />
            </div>

            {/* Media Upload Section */}
            <div>
              <Label className="text-white/90 font-light">Video or Image</Label>
              
              {/* Upload Mode Toggle */}
              <div className="glass rounded-xl p-1 flex gap-1 mt-2 mb-3">
                <button
                  type="button"
                  onClick={() => setUploadMode("file")}
                  className={`flex-1 px-4 py-2 rounded-lg font-light transition-all duration-300 flex items-center justify-center gap-2 ${
                    uploadMode === "file" ? 'bg-white/10 text-white' : 'text-white/50'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode("url")}
                  className={`flex-1 px-4 py-2 rounded-lg font-light transition-all duration-300 flex items-center justify-center gap-2 ${
                    uploadMode === "url" ? 'bg-white/10 text-white' : 'text-white/50'
                  }`}
                >
                  <LinkIcon className="w-4 h-4" />
                  URL Link
                </button>
              </div>

              {uploadMode === "file" ? (
                <div className="space-y-3">
                  {/* File Upload */}
                  {!formData.video_url && !formData.image_url ? (
                    <label className="glass rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:glass-strong transition-all duration-300 border-2 border-dashed border-white/20">
                      <input
                        type="file"
                        accept="video/*,image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                      {isUploading ? (
                        <>
                          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mb-2" />
                          <p className="text-white/70 text-sm">Uploading...</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-white/50 mb-2" />
                          <p className="text-white/90 text-sm font-light">Click to upload video or image</p>
                          <p className="text-white/50 text-xs mt-1">Supports MP4, MOV, JPG, PNG, etc.</p>
                        </>
                      )}
                    </label>
                  ) : (
                    <div className="glass rounded-xl p-4">
                      {/* Preview */}
                      {uploadedFilePreview && (
                        <div className="mb-3">
                          {uploadedFilePreview.type === 'video' ? (
                            <video
                              src={uploadedFilePreview.url}
                              controls
                              className="w-full rounded-lg"
                              style={{ maxHeight: '200px' }}
                            />
                          ) : (
                            <img
                              src={uploadedFilePreview.url}
                              alt="Preview"
                              className="w-full rounded-lg object-cover"
                              style={{ maxHeight: '200px' }}
                            />
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {formData.video_url ? (
                            <Video className="w-5 h-5 text-white/70" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-white/70" />
                          )}
                          <span className="text-white/90 text-sm font-light">
                            {formData.video_url ? 'Video uploaded' : 'Image uploaded'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={clearMedia}
                          className="text-white/70 hover:text-white text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    type="url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value, image_url: "" })}
                    className="glass border-white/20 text-white font-light"
                    placeholder="https://www.youtube.com/embed/... or video URL"
                  />
                  <p className="text-white/50 text-xs">For YouTube videos, use the embed format</p>
                </div>
              )}
            </div>

            {/* Primary Muscle Group */}
            <div>
              <Label className="text-white/90 font-light">Primary Muscle Group *</Label>
              <Select
                value={formData.primary_muscle_group}
                onValueChange={(value) => setFormData({ ...formData, primary_muscle_group: value })}
              >
                <SelectTrigger className="glass border-white/20 text-white mt-1 font-light">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-strong border-white/20">
                  {muscleGroups.map((muscle) => (
                    <SelectItem key={muscle} value={muscle} className="text-white hover:bg-white/10">
                      {muscle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Secondary Muscle Groups */}
            <div>
              <Label className="text-white/90 font-light">Secondary Muscle Groups</Label>
              <div className="space-y-2 mt-2">
                {formData.secondary_muscle_groups.map((muscle, index) => (
                  <div key={index} className="glass rounded-xl p-2 flex items-center justify-between">
                    <span className="text-white font-light text-sm">{muscle}</span>
                    <button
                      type="button"
                      onClick={() => removeSecondaryMuscle(muscle)}
                      className="text-white/70 hover:text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Select value={newSecondaryMuscle} onValueChange={setNewSecondaryMuscle}>
                    <SelectTrigger className="glass border-white/20 text-white font-light flex-1">
                      <SelectValue placeholder="Add secondary muscle" />
                    </SelectTrigger>
                    <SelectContent className="glass-strong border-white/20">
                      {muscleGroups
                        .filter(m => m !== formData.primary_muscle_group && !formData.secondary_muscle_groups.includes(m))
                        .map((muscle) => (
                          <SelectItem key={muscle} value={muscle} className="text-white hover:bg-white/10">
                            {muscle}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    onClick={addSecondaryMuscle}
                    className="glass px-4 py-2 rounded-xl text-white hover:glass-strong transition-all duration-300"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Equipment Needed */}
            <div>
              <Label className="text-white/90 font-light">Equipment Needed</Label>
              <div className="space-y-2 mt-2">
                {formData.equipment_needed.map((equipment, index) => (
                  <div key={index} className="glass rounded-xl p-2 flex items-center justify-between">
                    <span className="text-white font-light text-sm">{equipment}</span>
                    <button
                      type="button"
                      onClick={() => removeEquipment(equipment)}
                      className="text-white/70 hover:text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Select value={newEquipment} onValueChange={setNewEquipment}>
                    <SelectTrigger className="glass border-white/20 text-white font-light flex-1">
                      <SelectValue placeholder="Add equipment" />
                    </SelectTrigger>
                    <SelectContent className="glass-strong border-white/20">
                      {equipmentOptions
                        .filter(e => !formData.equipment_needed.includes(e))
                        .map((equipment) => (
                          <SelectItem key={equipment} value={equipment} className="text-white hover:bg-white/10">
                            {equipment}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    onClick={addEquipment}
                    className="glass px-4 py-2 rounded-xl text-white hover:glass-strong transition-all duration-300"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Exercise Type */}
            <div>
              <Label className="text-white/90 font-light">Exercise Type *</Label>
              <Select
                value={formData.exercise_type}
                onValueChange={(value) => setFormData({ ...formData, exercise_type: value })}
              >
                <SelectTrigger className="glass border-white/20 text-white mt-1 font-light">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-strong border-white/20">
                  <SelectItem value="Strength" className="text-white hover:bg-white/10">Strength</SelectItem>
                  <SelectItem value="Cardio" className="text-white hover:bg-white/10">Cardio</SelectItem>
                  <SelectItem value="Plyometric" className="text-white hover:bg-white/10">Plyometric</SelectItem>
                  <SelectItem value="Mobility" className="text-white hover:bg-white/10">Mobility</SelectItem>
                  <SelectItem value="Olympic Lift" className="text-white hover:bg-white/10">Olympic Lift</SelectItem>
                  <SelectItem value="HIIT" className="text-white hover:bg-white/10">HIIT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty Level */}
            <div>
              <Label className="text-white/90 font-light">Difficulty Level *</Label>
              <Select
                value={formData.difficulty_level}
                onValueChange={(value) => setFormData({ ...formData, difficulty_level: value })}
              >
                <SelectTrigger className="glass border-white/20 text-white mt-1 font-light">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-strong border-white/20">
                  <SelectItem value="Beginner" className="text-white hover:bg-white/10">Beginner</SelectItem>
                  <SelectItem value="Intermediate" className="text-white hover:bg-white/10">Intermediate</SelectItem>
                  <SelectItem value="Advanced" className="text-white hover:bg-white/10">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={createExerciseMutation.isPending || isUploading}
              className="w-full glass px-6 py-4 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300 disabled:opacity-50"
            >
              {createExerciseMutation.isPending ? 'Creating Exercise...' : 'Create Exercise'}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}