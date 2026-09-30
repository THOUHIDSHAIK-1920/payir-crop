import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { DiseaseDetection } from './components/DiseaseDetection';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { AuthModal } from './components/AuthModal';

import { Field, SensorData, DiseaseLog, Actuator, Language } from './types/database';
import { 
  INITIAL_FIELDS, 
  generate24HourSensorData, 
  INITIAL_ACTUATORS, 
  INITIAL_DISEASE_LOGS 
} from './lib/mockData';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';

export function App() {
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('payir_user_email') || null;
  });

  const [lang, setLang] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'disease' | 'reports' | 'settings'>('dashboard');

  // Core Data State
  const [fields, setFields] = useState<Field[]>(INITIAL_FIELDS);
  const [selectedField, setSelectedField] = useState<Field>(INITIAL_FIELDS[0]);
  
  // Sensor Telemetry State
  const [sensorData, setSensorData] = useState<SensorData[]>(() => {
    return generate24HourSensorData(INITIAL_FIELDS[0].field_name);
  });

  // Actuator State
  const [actuators, setActuators] = useState<Actuator[]>(INITIAL_ACTUATORS);

  // Disease Logs State
  const [diseaseLogs, setDiseaseLogs] = useState<DiseaseLog[]>(INITIAL_DISEASE_LOGS);

  // Check Supabase Auth Session
  useEffect(() => {
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.email) {
          setUserEmail(session.user.email);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user?.email) {
          setUserEmail(session.user.email);
          localStorage.setItem('payir_user_email', session.user.email);
        } else {
          setUserEmail(null);
          localStorage.removeItem('payir_user_email');
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  // Load Supabase Database tables if connected
  useEffect(() => {
    if (isSupabaseConfigured) {
      // Load Fields
      supabase.from('fields').select('*').then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const mapped: Field[] = data.map((item, idx) => ({
            id: item.id || `db-f-${idx}`,
            field_name: item.field_name,
            location: item.location,
            crop_type: item.crop_type,
            latitude: item.latitude || 10.7870 + idx * 0.1,
            longitude: item.longitude || 79.1378 + idx * 0.1,
            created_at: item.created_at
          }));
          setFields(mapped);
          setSelectedField(mapped[0]);
        }
      });

      // Load Sensor Data
      supabase.from('sensor_data').select('*').order('created_at', { ascending: false }).limit(50).then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setSensorData(data as SensorData[]);
        }
      });

      // Load Actuators
      supabase.from('actuators').select('*').then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setActuators(data as Actuator[]);
        }
      });

      // Load Disease Logs
      supabase.from('disease_logs').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setDiseaseLogs(data as DiseaseLog[]);
        }
      });
    }
  }, []);

  // When selected field changes, update sensor dataset filter/series
  useEffect(() => {
    const fieldSensorData = sensorData.filter(d => d.field_no === selectedField.field_name);
    if (fieldSensorData.length === 0) {
      // Generate new mock series for this field if none existed
      const newSeries = generate24HourSensorData(selectedField.field_name);
      setSensorData(prev => [...newSeries, ...prev]);
    }
  }, [selectedField]);

  // Handle User Login
  const handleLoginSuccess = (email: string) => {
    setUserEmail(email);
    localStorage.setItem('payir_user_email', email);
  };

  // Handle User Logout
  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUserEmail(null);
    localStorage.removeItem('payir_user_email');
  };

  // Handle new live sensor data tick
  const handleNewSensorReading = (reading: SensorData) => {
    setSensorData(prev => [reading, ...prev.slice(0, 150)]);
  };

  // Handle adding a new field
  const handleAddField = (newField: Field) => {
    setFields(prev => [...prev, newField]);
    
    // Also create associated actuator for the new field
    const newActuator: Actuator = {
      id: `act-${Date.now()}`,
      field_no: newField.field_name,
      motor_status: false,
      last_on: null
    };
    setActuators(prev => [...prev, newActuator]);
  };

  // Handle actuator motor ON/OFF toggle
  const handleToggleActuator = (actuatorId: string | number) => {
    setActuators(prev =>
      prev.map(act => {
        if (act.id === actuatorId) {
          const nextStatus = !act.motor_status;
          return {
            ...act,
            motor_status: nextStatus,
            last_on: nextStatus ? new Date().toISOString() : act.last_on
          };
        }
        return act;
      })
    );
  };

  // Handle new disease log entry
  const handleAddDiseaseLog = (log: DiseaseLog) => {
    setDiseaseLogs(prev => [log, ...prev]);
  };

  // Get current selected field sensor history and latest reading
  const currentFieldReadings = sensorData.filter(d => d.field_no === selectedField.field_name);
  const latestReading: SensorData = currentFieldReadings[0] || {
    id: 'default',
    field_no: selectedField.field_name,
    moisture: 65,
    temperature: 28.4,
    humidity: 72.0,
    npk: 145,
    growth_height: 34.2,
    created_at: new Date().toISOString()
  };

  // Filter 24-hour readings sorted chronologically for Recharts
  const sensor24hHistory = currentFieldReadings
    .slice(0, 24)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  if (!userEmail) {
    return <AuthModal onLoginSuccess={handleLoginSuccess} lang={lang} setLang={setLang} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        setLang={setLang}
        userEmail={userEmail}
        onLogout={handleLogout}
      />

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            fields={fields}
            selectedField={selectedField}
            setSelectedField={setSelectedField}
            sensorHistory={sensor24hHistory}
            latestReading={latestReading}
            lang={lang}
            onNewSensorReading={handleNewSensorReading}
          />
        )}

        {activeTab === 'disease' && (
          <DiseaseDetection
            diseaseLogs={diseaseLogs}
            onAddDiseaseLog={handleAddDiseaseLog}
            lang={lang}
          />
        )}

        {activeTab === 'reports' && (
          <Reports
            sensorData={sensorData}
            lang={lang}
          />
        )}

        {activeTab === 'settings' && (
          <Settings
            fields={fields}
            actuators={actuators}
            onAddField={handleAddField}
            onToggleActuator={handleToggleActuator}
            lang={lang}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-4 text-center text-xs text-slate-500 font-medium">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">Payir - பயிர்</span>
            <span>&bull; Smart Precision Agriculture System</span>
          </div>
          <div>
            Built with React, Supabase, Tailwind CSS, Leaflet & Recharts
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
