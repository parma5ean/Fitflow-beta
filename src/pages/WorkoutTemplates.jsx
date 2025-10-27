import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Dumbbell, Edit, Trash2, Copy } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function WorkoutTemplates() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['workoutTemplates'],
    queryFn: () => base44.entities.Workout.filter({ is_template: true }),
    initialData: [],
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Workout.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutTemplates'] });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (template) => {
      const { id, created_date, updated_date, created_by, ...templateData } = template;
      await base44.entities.Workout.create({
        ...templateData,
        name: `${template.name} (Copy)`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutTemplates'] });
    },
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="glass-strong rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Dumbbell className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-3xl md:text-4xl font-light text-white">Workout Templates</h1>
              <p className="text-white/70">Create reusable workout routines</p>
            </div>
          </div>
          <button
            onClick={() => navigate(createPageUrl('WorkoutTemplateBuilder'))}
            className="glass px-6 py-3 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300 shadow-lg"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            New Template
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      ) : templates.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="glass-strong rounded-3xl p-6 shadow-2xl hover:scale-105 transition-all duration-300">
              <div className="mb-4">
                <h3 className="text-2xl font-light text-white mb-2">{template.name}</h3>
                {template.description && (
                  <p className="text-white/70 text-sm line-clamp-2">{template.description}</p>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="text-white/80 text-sm">
                  {template.exercises?.length || 0} exercise{template.exercises?.length !== 1 ? 's' : ''}
                </div>
                {template.duration_minutes && (
                  <div className="text-white/80 text-sm">
                    ~{template.duration_minutes} minutes
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(createPageUrl('WorkoutTemplateBuilder') + `?templateId=${template.id}`)}
                  className="flex-1 glass px-4 py-3 rounded-xl text-white font-light hover:glass-strong transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => duplicateMutation.mutate(template)}
                  className="glass px-4 py-3 rounded-xl text-white hover:glass-strong transition-all duration-300"
                  title="Duplicate"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete this template?')) {
                      deleteMutation.mutate(template.id);
                    }
                  }}
                  className="glass px-4 py-3 rounded-xl text-red-400 hover:glass-strong transition-all duration-300"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-strong rounded-3xl p-12 text-center shadow-2xl">
          <Dumbbell className="w-16 h-16 text-white/30 mx-auto mb-6" />
          <h3 className="text-2xl font-light text-white mb-2">No Workout Templates Yet</h3>
          <p className="text-white/70 mb-6">Create reusable workout templates to use in your plans</p>
          <button
            onClick={() => navigate(createPageUrl('WorkoutTemplateBuilder'))}
            className="glass px-8 py-4 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            Create Your First Template
          </button>
        </div>
      )}
    </div>
  );
}