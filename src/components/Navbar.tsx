import React from 'react';
import { Sprout, LayoutDashboard, Bug, FileSpreadsheet, Settings, Languages, LogOut, Database, Wifi } from 'lucide-react';
import { Language } from '../types/database';
import { translations } from '../lib/translations';
import { isSupabaseConfigured } from '../lib/supabaseClient';

interface NavbarProps {
  activeTab: 'dashboard' | 'disease' | 'reports' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'disease' | 'reports' | 'settings') => void;
  lang: Language;
  setLang: (lang: Language) => void;
  userEmail: string | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  userEmail,
  onLogout
}) => {
  const t = translations[lang];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-emerald-900/40 px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 text-white shadow-lg shadow-emerald-900/50">
            <Sprout className="w-7 h-7 animate-pulse" />
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-green-300 to-teal-200 bg-clip-text text-transparent">
                {t.appName}
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-700/50">
                v2.5 Live
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800/80 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
              activeTab === 'dashboard'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>{t.navDashboard}</span>
          </button>

          <button
            onClick={() => setActiveTab('disease')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
              activeTab === 'disease'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Bug className="w-4 h-4" />
            <span>{t.navDisease}</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
              activeTab === 'reports'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{t.navReports}</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
              activeTab === 'settings'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>{t.navSettings}</span>
          </button>
        </nav>

        {/* Right Actions: Backend status, Language toggle, User profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Supabase status indicator */}
          <div className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            isSupabaseConfigured 
              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
              : 'bg-amber-950/60 text-amber-300 border-amber-800/60'
          }`}>
            {isSupabaseConfigured ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>{t.liveConnected}</span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.demoMode}</span>
              </>
            )}
          </div>

          {/* Language Toggle Button */}
          <button
            onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs sm:text-sm font-semibold border border-emerald-800/50 transition"
            title="Toggle Language / மொழியை மாற்றுக"
          >
            <Languages className="w-4 h-4" />
            <span>{lang === 'en' ? 'தமிழ்' : 'English'}</span>
          </button>

          {/* User Sign Out */}
          {userEmail && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <span className="text-xs text-slate-300 font-medium hidden xl:inline truncate max-w-[120px]">
                {userEmail}
              </span>
              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-800 transition"
                title={t.logout}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
