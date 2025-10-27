import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, ArrowRight } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function CreateProgramDialog({ open, onClose }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [programData, setProgramData] = useState({
    name: "",
    description: "",
    duration_weeks: 4,
    goal: "hypertrophy",
    difficulty: "intermediate"
  });

  const createMutation = useMutation({
    mutationFn: async (useAI) => {
      const newProgram = await base44.entities.Program.create({
        ...programData,
        status: 'draft',
        is_ai_generated: useAI
      });

      return newProgram;
    },
    onSuccess: (newProgram) => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      onClose();
      navigate(createPageUrl('ProgramBuilder') + `?programId=${newProgram.id}`);
    }
  });

  const handleCreate = (useAI = false) => {
    if (!programData.name) {
      alert('Please enter a program name');
      return;
    }
    createMutation.mutate(useAI);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-strong border-white/20 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light">Create New Program</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Program Name */}
          <div>
            <Label className="text-white/90 font-light">Program Name *</Label>
            <Input
              value={programData.name}
              onChange={(e) => setProgramData({ ...programData, name: e.target.value })}
              className="glass border-white/20 text-white mt-1 font-light"
              placeholder="e.g., 4-Week Strength Split"
            />
          </div>

          {/* Description */}
          <div>
            <Label className="text-white/90 font-light">Description (Optional)</Label>
            <Textarea
              value={programData.description}
              onChange={(e) => setProgramData({ ...programData, description: e.target.value })}
              className="glass border-white/20 text-white mt-1 font-light"
              placeholder="Brief overview of the program..."
              rows={2}
            />
          </div>

          {/* Duration */}
          <div>
            <Label className="text-white/90 font-light">Duration (weeks) *</Label>
            <Input
              type="number"
              min="1"
              max="52"
              value={programData.duration_weeks}
              onChange={(e) => setProgramData({ ...programData, duration_weeks: parseInt(e.target.value) })}
              className="glass border-white/20 text-white mt-1 font-light"
            />
          </div>

          {/* Goal & Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white/90 font-light">Primary Goal *</Label>
              <Select value={programData.goal} onValueChange={(value) => setProgramData({ ...programData, goal: value })}>
                <SelectTrigger className="glass border-white/20 text-white mt-1 font-light">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-strong border-white/20">
                  <SelectItem value="strength">Strength</SelectItem>
                  <SelectItem value="hypertrophy">Hypertrophy (Muscle Gain)</SelectItem>
                  <SelectItem value="fat_loss">Fat Loss</SelectItem>
                  <SelectItem value="endurance">Endurance</SelectItem>
                  <SelectItem value="mobility">Mobility</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/90 font-light">Difficulty *</Label>
              <Select value={programData.difficulty} onValueChange={(value) => setProgramData({ ...programData, difficulty: value })}>
                <SelectTrigger className="glass border-white/20 text-white mt-1 font-light">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-strong border-white/20">
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4">
            <button
              onClick={() => handleCreate(false)}
              disabled={createMutation.isPending}
              className="w-full glass px-6 py-4 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300 flex items-center justify-center gap-2"
            >
              Start from Scratch <ArrowRight className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => handleCreate(true)}
              disabled={createMutation.isPending}
              className="w-full glass px-6 py-4 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Generate with AI (Coming Soon)
            </button>

            <button
              onClick={onClose}
              className="w-full glass px-6 py-3 rounded-xl text-white/70 font-light hover:glass-strong transition-all duration-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}