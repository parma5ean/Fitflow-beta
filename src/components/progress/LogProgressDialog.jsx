import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Upload } from "lucide-react";
import { format } from "date-fns";
import { 
  convertWeightToMetric, 
  convertWeightFromMetric, 
  getWeightUnit,
  convertMeasurementToMetric,
  convertMeasurementFromMetric,
  getMeasurementUnit,
  UNIT_SYSTEMS
} from "@/components/utils/unitConversion";

export default function LogProgressDialog({ open, onClose }) {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    weight: "",
    body_fat_percentage: "",
    measurements: {
      chest: "",
      waist: "",
      hips: "",
      arms: "",
      thighs: ""
    },
    notes: "",
    photo_url: ""
  });
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    if (open) {
      loadUser();
    }
  }, [open]);

  const unitSystem = user?.unit_system || UNIT_SYSTEMS.METRIC;

  const saveMutation = useMutation({
    mutationFn: (data) => {
      // Convert all values to metric for storage
      const weightInKg = convertWeightToMetric(parseFloat(data.weight), unitSystem);
      const measurementsInCm = {};
      
      Object.entries(data.measurements).forEach(([key, value]) => {
        if (value) {
          measurementsInCm[key] = convertMeasurementToMetric(parseFloat(value), unitSystem);
        }
      });
      
      return base44.entities.ProgressLog.create({
        date: data.date,
        weight: weightInKg,
        body_fat_percentage: data.body_fat_percentage ? parseFloat(data.body_fat_percentage) : undefined,
        measurements: Object.keys(measurementsInCm).length > 0 ? measurementsInCm : undefined,
        notes: data.notes,
        photo_url: data.photo_url
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progressLogs'] });
      queryClient.invalidateQueries({ queryKey: ['recentProgress'] });
      onClose();
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        weight: "",
        body_fat_percentage: "",
        measurements: { chest: "", waist: "", hips: "", arms: "", thighs: "" },
        notes: "",
        photo_url: ""
      });
    }
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, photo_url: file_url });
    } catch (error) {
      console.error("Error uploading photo:", error);
    }
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-strong border-white/20 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light flex items-center justify-between">
            Log Progress
            <button onClick={onClose} className="glass p-2 rounded-xl hover:glass-strong">
              <X className="w-5 h-5" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white/90 font-light">Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="glass border-white/20 text-white mt-1 font-light"
                required
              />
            </div>
            <div>
              <Label className="text-white/90 font-light">
                Weight ({getWeightUnit(unitSystem)})
              </Label>
              <Input
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="glass border-white/20 text-white mt-1 font-light"
                placeholder={unitSystem === UNIT_SYSTEMS.METRIC ? "70.5" : "155.4"}
                required
              />
            </div>
          </div>

          <div>
            <Label className="text-white/90 font-light">Body Fat %</Label>
            <Input
              type="number"
              step="0.1"
              value={formData.body_fat_percentage}
              onChange={(e) => setFormData({ ...formData, body_fat_percentage: e.target.value })}
              className="glass border-white/20 text-white mt-1 font-light"
              placeholder="15.0"
            />
          </div>

          <div className="glass rounded-2xl p-4 space-y-3">
            <Label className="text-white/90 font-light">
              Measurements ({getMeasurementUnit(unitSystem)})
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                step="0.1"
                value={formData.measurements.chest}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  measurements: { ...formData.measurements, chest: e.target.value }
                })}
                className="glass border-white/20 text-white placeholder:text-white/50 font-light"
                placeholder="Chest"
              />
              <Input
                type="number"
                step="0.1"
                value={formData.measurements.waist}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  measurements: { ...formData.measurements, waist: e.target.value }
                })}
                className="glass border-white/20 text-white placeholder:text-white/50 font-light"
                placeholder="Waist"
              />
              <Input
                type="number"
                step="0.1"
                value={formData.measurements.hips}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  measurements: { ...formData.measurements, hips: e.target.value }
                })}
                className="glass border-white/20 text-white placeholder:text-white/50 font-light"
                placeholder="Hips"
              />
              <Input
                type="number"
                step="0.1"
                value={formData.measurements.arms}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  measurements: { ...formData.measurements, arms: e.target.value }
                })}
                className="glass border-white/20 text-white placeholder:text-white/50 font-light"
                placeholder="Arms"
              />
              <Input
                type="number"
                step="0.1"
                value={formData.measurements.thighs}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  measurements: { ...formData.measurements, thighs: e.target.value }
                })}
                className="glass border-white/20 text-white placeholder:text-white/50 font-light"
                placeholder="Thighs"
              />
            </div>
          </div>

          <div>
            <Label className="text-white/90 font-light">Progress Photo</Label>
            <div className="mt-1">
              <label className="glass border-white/20 border rounded-2xl p-4 flex items-center justify-center cursor-pointer hover:glass-strong transition-all duration-300">
                <Upload className="w-5 h-5 mr-2" />
                <span className="font-light">{uploading ? 'Uploading...' : formData.photo_url ? 'Photo uploaded' : 'Upload photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <Label className="text-white/90 font-light">Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="glass border-white/20 text-white placeholder:text-white/50 mt-1 font-light"
              placeholder="How are you feeling?"
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="w-full glass px-6 py-3 rounded-xl text-white font-light hover:glass-strong transition-all duration-300 disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Progress'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}