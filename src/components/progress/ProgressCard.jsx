import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Calendar, Weight, Percent, Ruler } from "lucide-react";
import { format } from "date-fns";
import { formatWeight, formatMeasurement, UNIT_SYSTEMS } from "@/components/utils/unitConversion";

export default function ProgressCard({ log }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const unitSystem = user?.unit_system || UNIT_SYSTEMS.METRIC;

  return (
    <div className="glass-strong rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-white/70">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">{format(new Date(log.date), 'MMMM d, yyyy')}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass rounded-xl p-3">
          <div className="flex items-center gap-2 text-white/70 mb-1">
            <Weight className="w-4 h-4" />
            <span className="text-xs">Weight</span>
          </div>
          <p className="text-white text-xl font-light">{formatWeight(log.weight, unitSystem)}</p>
        </div>

        {log.body_fat_percentage && (
          <div className="glass rounded-xl p-3">
            <div className="flex items-center gap-2 text-white/70 mb-1">
              <Percent className="w-4 h-4" />
              <span className="text-xs">Body Fat</span>
            </div>
            <p className="text-white text-xl font-light">{log.body_fat_percentage}%</p>
          </div>
        )}

        {log.measurements && Object.keys(log.measurements).length > 0 && (
          <div className="glass rounded-xl p-3 col-span-2">
            <div className="flex items-center gap-2 text-white/70 mb-2">
              <Ruler className="w-4 h-4" />
              <span className="text-xs">Measurements</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              {Object.entries(log.measurements).map(([key, value]) => (
                <div key={key}>
                  <span className="text-white/70 capitalize">{key}:</span>
                  <span className="text-white ml-1">{formatMeasurement(value, unitSystem)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {log.photo_url && (
        <div className="mt-4">
          <img 
            src={log.photo_url} 
            alt="Progress" 
            className="w-full h-48 object-cover rounded-xl"
          />
        </div>
      )}

      {log.notes && (
        <p className="mt-4 text-white/70 text-sm">{log.notes}</p>
      )}
    </div>
  );
}