import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Plus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import LogProgressDialog from "../components/progress/LogProgressDialog";
import ProgressCard from "../components/progress/ProgressCard";
import { formatWeight, getWeightUnit, convertWeightFromMetric, UNIT_SYSTEMS } from "@/components/utils/unitConversion";

export default function Progress() {
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const unitSystem = user?.unit_system || UNIT_SYSTEMS.METRIC;

  const { data: progressLogs, isLoading } = useQuery({
    queryKey: ['progressLogs'],
    queryFn: () => base44.entities.ProgressLog.list('-date'),
    initialData: []
  });

  const chartData = progressLogs
    .slice()
    .reverse()
    .map(log => ({
      date: format(new Date(log.date), 'MMM d'),
      weight: convertWeightFromMetric(log.weight, unitSystem),
      bodyFat: log.body_fat_percentage
    }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="glass-strong rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <TrendingUp className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-3xl md:text-4xl font-light text-white">Progress Tracking</h1>
              <p className="text-white/70">Monitor your fitness journey</p>
            </div>
          </div>
          <button
            onClick={() => setShowLogDialog(true)}
            className="glass px-6 py-3 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300 shadow-lg"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            Log Progress
          </button>
        </div>
      </div>

      {progressLogs.length > 0 ? (
        <>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="glass-strong rounded-3xl p-6 shadow-2xl">
              <h3 className="text-xl font-light text-white mb-4">
                Weight Progress ({getWeightUnit(unitSystem)})
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.7)" />
                  <YAxis stroke="rgba(255,255,255,0.7)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '12px',
                      color: 'white'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#ffffff"
                    strokeWidth={2}
                    dot={{ fill: '#ffffff', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-strong rounded-3xl p-6 shadow-2xl">
              <h3 className="text-xl font-light text-white mb-4">Body Fat %</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData.filter(d => d.bodyFat)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.7)" />
                  <YAxis stroke="rgba(255,255,255,0.7)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '12px',
                      color: 'white'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="bodyFat"
                    stroke="#ffffff"
                    strokeWidth={2}
                    dot={{ fill: '#ffffff', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl font-light text-white">Recent Logs</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {progressLogs.map((log) => (
                <ProgressCard key={log.id} log={log} />
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="glass-strong rounded-3xl p-12 text-center shadow-2xl">
          <TrendingUp className="w-16 h-16 text-white/30 mx-auto mb-6" />
          <h3 className="text-2xl font-light text-white mb-2">Start Tracking Your Progress</h3>
          <p className="text-white/70 mb-6">Log your first entry to see your fitness journey</p>
          <button
            onClick={() => setShowLogDialog(true)}
            className="glass px-8 py-4 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            Log Your First Entry
          </button>
        </div>
      )}

      <LogProgressDialog
        open={showLogDialog}
        onClose={() => setShowLogDialog(false)}
      />
    </div>
  );
}