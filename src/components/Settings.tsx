import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, PlusCircle, Power, 
  MapPin, Database, CheckCircle2, AlertCircle, Code, Copy, Check
} from 'lucide-react';
import { Field, Actuator, Language } from '../types/database';
import { translations } from '../lib/translations';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

interface SettingsProps {
  fields: Field[];
  actuators: Actuator[];
  onAddField: (field: Field) => void;
  onToggleActuator: (actuatorId: string | number) => void;
  lang: Language;
}

export const Settings: React.FC<SettingsProps> = ({
  fields,
  actuators,
  onAddField,
  onToggleActuator,
  lang
}) => {
  const t = translations[lang];

  // Form state for adding new field
  const [newFieldName, setNewFieldName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newCropType, setNewCropType] = useState('');
  const [newLat, setNewLat] = useState('10.8000');
  const [newLng, setNewLng] = useState('78.7000');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName || !newLocation || !newCropType) return;

    setIsSubmitting(true);

    const newFieldObj: Field = {
      id: `f-${Date.now()}`,
      field_name: newFieldName,
      location: newLocation,
      crop_type: newCropType,
      latitude: parseFloat(newLat) || 10.7870,
      longitude: parseFloat(newLng) || 79.1378,
      created_at: new Date().toISOString()
    };

    // Insert into 'fields' table in Supabase if configured
    if (isSupabaseConfigured) {
      try {
        await supabase.from('fields').insert([{
          field_name: newFieldObj.field_name,
          location: newFieldObj.location,
          crop_type: newFieldObj.crop_type
        }]);
      } catch (err) {
        console.error('Supabase error inserting field:', err);
      }
    }

    onAddField(newFieldObj);
    setSuccessMsg(t.fieldAddedSuccess);
    setNewFieldName('');
    setNewLocation('');
    setNewCropType('');
    setIsSubmitting(false);

    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleActuatorToggle = async (actuator: Actuator) => {
    const nextStatus = !actuator.motor_status;
    const nowIso = new Date().toISOString();

    // Update 'actuators' table in Supabase if configured
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('actuators')
          .update({
            motor_status: nextStatus,
            last_on: nextStatus ? nowIso : actuator.last_on
          })
          .eq('field_no', actuator.field_no);
      } catch (err) {
        console.error('Supabase error updating actuator:', err);
      }
    }

    onToggleActuator(actuator.id);
  };

  const sqlCodeSnippet = `-- Supabase Table Schema Setup SQL Script
CREATE TABLE IF NOT EXISTS fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name text NOT NULL,
  location text NOT NULL,
  crop_type text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sensor_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_no text NOT NULL,
  moisture int NOT NULL,
  temperature float NOT NULL,
  humidity float NOT NULL,
  npk int NOT NULL,
  growth_height float DEFAULT 32.5,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS disease_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  disease_name text NOT NULL,
  confidence float NOT NULL,
  suggestion text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS actuators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_no text NOT NULL UNIQUE,
  motor_status boolean DEFAULT false,
  last_on timestamp with time zone DEFAULT now()
);`;

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-emerald-400" />
            {t.settingsTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t.settingsSubtitle}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Irrigation Actuators Toggle Motors */}
        <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <Power className="w-5 h-5 text-emerald-400" />
            {t.actuatorsTitle}
          </h3>
          <p className="text-xs text-slate-400">
            Control automated solenoid water pumps and irrigation motor actuators across your fields. Updates the <code className="text-emerald-300">actuators</code> table in real time.
          </p>

          <div className="space-y-3 pt-2">
            {actuators.map((act) => (
              <div
                key={act.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-100">
                    {act.field_no}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {t.lastActivated}: {act.last_on ? new Date(act.last_on).toLocaleString() : 'Never'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                    act.motor_status
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-700 shadow-md'
                      : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}>
                    {act.motor_status ? t.motorOn : t.motorOff}
                  </span>

                  <button
                    onClick={() => handleActuatorToggle(act)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg cursor-pointer ${
                      act.motor_status
                        ? 'bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/80'
                    }`}
                  >
                    <Power className={`w-3.5 h-3.5 ${act.motor_status ? 'animate-pulse' : ''}`} />
                    <span>{act.motor_status ? t.turnOff : t.turnOn}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Add New Field Form */}
        <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-emerald-400" />
            {t.addFieldTitle}
          </h3>
          <p className="text-xs text-slate-400">
            Register a new farm plot to start logging sensor telemetry. Inserts to Supabase <code className="text-emerald-300">fields</code> table.
          </p>

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateField} className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                {t.fieldNameLabel}
              </label>
              <input
                type="text"
                placeholder="e.g. Field 4 - Cotton (பருத்தி)"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                required
                className="w-full bg-slate-950 text-slate-100 text-xs font-medium px-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                {t.locationLabel}
              </label>
              <input
                type="text"
                placeholder="e.g. Salem Agri Basin"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                required
                className="w-full bg-slate-950 text-slate-100 text-xs font-medium px-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Latitude</label>
                <input
                  type="text"
                  value={newLat}
                  onChange={(e) => setNewLat(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 text-xs font-medium px-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Longitude</label>
                <input
                  type="text"
                  value={newLng}
                  onChange={(e) => setNewLng(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 text-xs font-medium px-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                {t.cropTypeLabel}
              </label>
              <input
                type="text"
                placeholder="e.g. Hybrid Bt Cotton"
                value={newCropType}
                onChange={(e) => setNewCropType(e.target.value)}
                required
                className="w-full bg-slate-950 text-slate-100 text-xs font-medium px-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/80 transition cursor-pointer mt-2"
            >
              {isSubmitting ? 'Registering Field...' : t.saveFieldBtn}
            </button>
          </form>
        </div>

      </div>

      {/* SQL Setup Helper Section */}
      <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <Code className="w-5 h-5 text-emerald-400" />
            Supabase SQL Setup Snippet
          </h3>
          <button
            onClick={() => {
              navigator.clipboard.writeText(sqlCodeSnippet);
              setCopiedSql(true);
              setTimeout(() => setCopiedSql(false), 3000);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-400 border border-slate-700 transition"
          >
            {copiedSql ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL Script'}</span>
          </button>
        </div>
        <p className="text-xs text-slate-400">
          Run this SQL script in your Supabase project SQL Editor to create the required 4 tables.
        </p>
        <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
          {sqlCodeSnippet}
        </pre>
      </div>

    </div>
  );
};
