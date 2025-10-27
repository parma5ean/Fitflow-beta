import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { TrendingUp, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function RecentProgress({ progressLogs }) {
  return (
    <div className="glass-strong rounded-3xl p-6 md:p-8 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-white" />
          <h2 className="text-2xl font-light text-white">Recent Progress</h2>
        </div>
        <Link to={createPageUrl("Progress")}>
          <button className="glass px-4 py-2 rounded-xl text-white text-sm hover:glass-strong transition-all duration-300">
            View All
          </button>
        </Link>
      </div>

      {progressLogs.length > 0 ? (
        <div className="space-y-3">
          {progressLogs.slice(0, 3).map((log) => (
            <div key={log.id} className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-white/70" />
                  <div>
                    <p className="text-white font-light">
                      {format(new Date(log.date), 'MMM d, yyyy')}
                    </p>
                    <p className="text-white/70 text-sm">Weight: {log.weight} kg</p>
                  </div>
                </div>
                {log.body_fat_percentage && (
                  <div className="text-right">
                    <p className="text-white/70 text-xs">Body Fat</p>
                    <p className="text-white font-light">{log.body_fat_percentage}%</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-white/70 mb-4">No progress logged yet</p>
          <Link to={createPageUrl("Progress")}>
            <button className="glass px-6 py-3 rounded-xl text-white hover:glass-strong transition-all duration-300">
              Log Your First Entry
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}