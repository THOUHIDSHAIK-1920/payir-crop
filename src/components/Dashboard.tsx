import React, { useState, useEffect } from 'react';
import { 
  Droplets, Thermometer, Wind, FlaskConical, 
  Activity, MapPin, CheckCircle2, AlertTriangle, 
  TrendingUp, Radio, RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, 
  XAxis, YAxis, Tooltip, CartesianGrid, Legend 
} from 'recharts';
import { Field, SensorData, Language } from '../types/database';
import { translations } from '../lib/translations';
import { LeafletMap } from './LeafletMap';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

interface DashboardProps {
  fields: Field[];
  selectedField: Field;
  setSelectedField: (field: Field) => void;
  sensorHistory: SensorData[];
  latestReading: SensorData;
  lang: Language;
  onNewSensorReading: (reading: SensorData) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  fields,
  selectedField,
  setSelectedField,
  sensorHistory,
  latestReading,
  lang,
  onNewSensorReading,
}) => {
  const t = translations[lang];
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);

  // Field Status condition
  const isHealthy = 
    latestReading.moisture >= 35 && 
    latestReading.moisture <= 85 && 
    latestReading.temperature <= 36;

  const healthStatus: 'healthy' | 'alert' = isHealthy ? 'healthy' : 'alert';

  // Format Recharts data timestamps
  const chartData = sensorHistory.map(item => {
    const d = new Date(item.created_at);
    return {
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      Moisture: item.moisture,
      Temperature: item.temperature,
      Humidity: item.humidity,
      NPK: item.npk
    };
  });

  // Setup Supabase Realtime Channel or simulated pulse stream
  useEffect(() => {
    let intervalId: any = null;

    if (isSupabaseConfigured) {
      // 1. Listen for real-time inserts from Supabase sensor_data table
      const channel = supabase
        .channel('sensor_data_realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'sensor_data' },
          (payload) => {
            const newRow = payload.new as SensorData;
            if (newRow.field_no === selectedField.field_name) {
              onNewSensorReading(newRow);
            }
          }
        )
        .subscribe();

      // 2. Periodically send live IoT telemetry to Supabase sensor_data table if active
      if (isLiveStreaming) {
        intervalId = setInterval(async () => {
          const deltaMoisture = (Math.random() * 2 - 1);
          const deltaTemp = (Math.random() * 0.4 - 0.2);
          const deltaHum = (Math.random() * 1.2 - 0.6);
          const deltaNpk = (Math.floor(Math.random() * 3) - 1);

          const nextMoisture = Math.max(20, Math.min(95, Math.round(latestReading.moisture + deltaMoisture)));
          const nextTemp = Number(Math.max(18, Math.min(45, latestReading.temperature + deltaTemp)).toFixed(1));
          const nextHum = Number(Math.max(30, Math.min(98, latestReading.humidity + deltaHum)).toFixed(1));
          const nextNpk = Math.max(100, Math.min(300, latestReading.npk + deltaNpk));

          try {
            const { data, error } = await supabase.from('sensor_data').insert([{
              field_no: selectedField.field_name,
              moisture: nextMoisture,
              temperature: nextTemp,
              humidity: nextHum,
              npk: nextNpk,
              growth_height: Number((latestReading.growth_height + 0.01).toFixed(1)),
              created_at: new Date().toISOString()
            }]).select('*').single();

            if (!error && data) {
              onNewSensorReading(data as SensorData);
            }
          } catch (err) {
            console.error('Supabase live insert error:', err);
          }
        }, 5000);
      }

      return () => {
        supabase.removeChannel(channel);
        if (intervalId) clearInterval(intervalId);
      };
    } else if (isLiveStreaming) {
      // Fallback local simulated sensor stream
      intervalId = setInterval(() => {
        const deltaMoisture = (Math.random() * 2 - 1);
        const deltaTemp = (Math.random() * 0.4 - 0.2);
        const deltaHum = (Math.random() * 1.2 - 0.6);
        const deltaNpk = (Math.floor(Math.random() * 3) - 1);

        const updated: SensorData = {
          id: `live-${Date.now()}`,
          field_no: selectedField.field_name,
          moisture: Math.max(20, Math.min(95, Math.round(latestReading.moisture + deltaMoisture))),
          temperature: Number(Math.max(18, Math.min(45, latestReading.temperature + deltaTemp)).toFixed(1)),
          humidity: Number(Math.max(30, Math.min(98, latestReading.humidity + deltaHum)).toFixed(1)),
          npk: Math.max(100, Math.min(300, latestReading.npk + deltaNpk)),
          growth_height: Number((latestReading.growth_height + 0.01).toFixed(1)),
          created_at: new Date().toISOString()
        };

        onNewSensorReading(updated);
      }, 4000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLiveStreaming, selectedField, latestReading, onNewSensorReading]);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-xl">
        
        {/* Field Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-emerald-400" />
            {t.selectField}:
          </label>
          <select
            value={selectedField.id}
            onChange={(e) => {
              const found = fields.find(f => f.id === e.target.value);
              if (found) setSelectedField(found);
            }}
            className="bg-slate-950 text-emerald-300 font-semibold px-4 py-2.5 rounded-2xl border border-emerald-900/60 focus:outline-none focus:border-emerald-500 text-sm shadow-inner cursor-pointer"
          >
            {fields.map((f) => (
              <option key={f.id} value={f.id} className="bg-slate-900 text-slate-100">
                {f.field_name} ({f.crop_type})
              </option>
            ))}
          </select>
        </div>

        {/* Status Indicator & Live Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Live Data Pulse Badge */}
          <button
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-xs font-bold border transition ${
              isLiveStreaming
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60 shadow-md'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveStreaming ? 'text-emerald-400 animate-ping' : ''}`} />
            <span>{isLiveStreaming ? 'REALTIME LIVE FEED' : 'PAUSED'}</span>
          </button>

          {/* Health Status Indicator (Green = Healthy, Red = Alert) */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-bold text-xs sm:text-sm tracking-wide shadow-lg ${
            isHealthy
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-600/80 glow-emerald'
              : 'bg-rose-950/90 text-rose-300 border-rose-600/80 glow-rose animate-pulse'
          }`}>
            {isHealthy ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>{t.fieldHealthy}</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <span>{t.fieldAlert}</span>
              </>
            )}
          </div>
        </div>

      </div>

      {/* 4 Sensor Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Soil Moisture % */}
        <div className="relative overflow-hidden bg-slate-900/80 p-5 rounded-3xl border border-slate-800 hover:border-emerald-700/50 transition-all duration-300 group shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t.moistureCardTitle}
            </span>
            <div className="p-3 rounded-2xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/50 group-hover:scale-110 transition-transform">
              <Droplets className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {latestReading.moisture}<span className="text-xl font-medium text-cyan-400">%</span>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              latestReading.moisture >= 40 && latestReading.moisture <= 80
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-amber-950 text-amber-400 border border-amber-800'
            }`}>
              {latestReading.moisture >= 40 && latestReading.moisture <= 80 ? t.optimal : t.warning}
            </span>
          </div>
          {/* Progress Bar */}
          <div className="mt-4 w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, latestReading.moisture))}%` }}
            ></div>
          </div>
          <p className="mt-3 text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span>Target: 40% - 80%</span>
            <span className="text-cyan-400 font-semibold">Live telemetry</span>
          </p>
        </div>

        {/* Card 2: Temperature °C */}
        <div className="relative overflow-hidden bg-slate-900/80 p-5 rounded-3xl border border-slate-800 hover:border-amber-700/50 transition-all duration-300 group shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t.tempCardTitle}
            </span>
            <div className="p-3 rounded-2xl bg-amber-950/80 text-amber-400 border border-amber-800/50 group-hover:scale-110 transition-transform">
              <Thermometer className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {latestReading.temperature}<span className="text-xl font-medium text-amber-400">°C</span>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              latestReading.temperature <= 35
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-rose-950 text-rose-400 border border-rose-800'
            }`}>
              {latestReading.temperature <= 35 ? t.optimal : t.warning}
            </span>
          </div>
          {/* Progress Bar */}
          <div className="mt-4 w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div 
              className="bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (latestReading.temperature / 50) * 100)}%` }}
            ></div>
          </div>
          <p className="mt-3 text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span>Ideal: 20°C - 33°C</span>
            <span className="text-amber-400 font-semibold">Sensor Node 01</span>
          </p>
        </div>

        {/* Card 3: Humidity % */}
        <div className="relative overflow-hidden bg-slate-900/80 p-5 rounded-3xl border border-slate-800 hover:border-emerald-700/50 transition-all duration-300 group shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t.humidityCardTitle}
            </span>
            <div className="p-3 rounded-2xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 group-hover:scale-110 transition-transform">
              <Wind className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {latestReading.humidity}<span className="text-xl font-medium text-emerald-400">%</span>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
              {t.optimal}
            </span>
          </div>
          {/* Progress Bar */}
          <div className="mt-4 w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div 
              className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, latestReading.humidity))}%` }}
            ></div>
          </div>
          <p className="mt-3 text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span>Ambient Air RH</span>
            <span className="text-emerald-400 font-semibold">Normal</span>
          </p>
        </div>

        {/* Card 4: NPK Level */}
        <div className="relative overflow-hidden bg-slate-900/80 p-5 rounded-3xl border border-slate-800 hover:border-violet-700/50 transition-all duration-300 group shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t.npkCardTitle}
            </span>
            <div className="p-3 rounded-2xl bg-violet-950/80 text-violet-400 border border-violet-800/50 group-hover:scale-110 transition-transform">
              <FlaskConical className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {latestReading.npk}<span className="text-xs font-semibold text-violet-400 ml-1">PPM</span>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-950 text-violet-300 border border-violet-800">
              Balanced
            </span>
          </div>
          {/* Progress Bar */}
          <div className="mt-4 w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div 
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (latestReading.npk / 250) * 100)}%` }}
            ></div>
          </div>
          <p className="mt-3 text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span>Nitrogen-Phos-Potass</span>
            <span className="text-violet-400 font-semibold">14:10:18 Ratio</span>
          </p>
        </div>

      </div>

      {/* Main Grid: Recharts Live Chart & Leaflet Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recharts Line Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900/80 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                {t.chartTitle}
              </h3>
              <p className="text-xs text-slate-400">
                24-hour continuous sensor monitoring for {selectedField.field_name}
              </p>
            </div>
            <div className="text-xs font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-3 py-1 rounded-full flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
              Live Stream
            </div>
          </div>

          <div className="h-[320px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#334155', 
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '12px'
                  }} 
                />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                <Line 
                  type="monotone" 
                  dataKey="Moisture" 
                  name={t.moistureChartLabel}
                  stroke="#06b6d4" 
                  strokeWidth={2.5} 
                  dot={false}
                  activeDot={{ r: 6 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="Temperature" 
                  name={t.tempChartLabel}
                  stroke="#f59e0b" 
                  strokeWidth={2.5} 
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="Humidity" 
                  name={t.humidityChartLabel}
                  stroke="#10b981" 
                  strokeWidth={2} 
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leaflet Field Location Map (1 Col) */}
        <div className="bg-slate-900/80 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-400" />
                {t.fieldLocation}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Realtime GPS coordinates for {selectedField.crop_type}
            </p>
          </div>

          <LeafletMap selectedField={selectedField} status={healthStatus} />

          <div className="mt-4 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-500 font-medium">{t.cropType}:</span>
              <span className="font-semibold text-emerald-400">{selectedField.crop_type}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-500 font-medium">Location:</span>
              <span className="font-semibold truncate max-w-[180px]">{selectedField.location}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
