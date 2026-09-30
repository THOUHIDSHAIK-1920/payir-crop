import React, { useState } from 'react';
import { Sprout, Lock, Mail, ArrowRight, ShieldCheck, Languages } from 'lucide-react';
import { Language } from '../types/database';
import { translations } from '../lib/translations';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

interface AuthModalProps {
  onLoginSuccess: (email: string) => void;
  lang: Language;
  setLang: (lang: Language) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onLoginSuccess,
  lang,
  setLang
}) => {
  const t = translations[lang];

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('farmer@payir-agri.com');
  const [password, setPassword] = useState('farmer123');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    if (isSupabaseConfigured) {
      try {
        if (isSignUp) {
          const { data, error } = await supabase.auth.signUp({
            email,
            password
          });
          if (error) throw error;
          if (data.user) {
            onLoginSuccess(data.user.email || email);
          }
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          if (error) throw error;
          if (data.user) {
            onLoginSuccess(data.user.email || email);
          }
        }
      } catch (err: any) {
        setErrorMessage(err.message || t.invalidCredentials);
      } finally {
        setLoading(false);
      }
    } else {
      // Demo authentication mode
      setTimeout(() => {
        setLoading(false);
        onLoginSuccess(email);
      }, 500);
    }
  };

  const handleInstantDemo = () => {
    onLoginSuccess('demo.farmer@payir-agri.org');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-teal-600/10 rounded-full blur-2xl pointer-events-none"></div>

      {/* Top Bar Language Switcher */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-700 text-emerald-400 text-xs font-bold shadow-lg transition"
        >
          <Languages className="w-4 h-4" />
          <span>{lang === 'en' ? 'தமிழ்' : 'English'}</span>
        </button>
      </div>

      {/* Auth Card Container */}
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6 relative z-10 border-emerald-900/30">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center text-white shadow-xl shadow-emerald-950">
            <Sprout className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-green-300 to-teal-200 bg-clip-text text-transparent mt-3">
            {t.appName}
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            {t.loginSubtitle}
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-950/80 text-rose-300 border border-rose-800 text-xs font-semibold text-center">
            {errorMessage}
          </div>
        )}

        {/* Login / Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t.emailLabel}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-950 text-slate-100 text-xs sm:text-sm pl-10 pr-4 py-3 rounded-2xl border border-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t.passwordLabel}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-950 text-slate-100 text-xs sm:text-sm pl-10 pr-4 py-3 rounded-2xl border border-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-950 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>{isSignUp ? t.signUpBtn : t.signInBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-slate-800 w-full"></div>
          <span className="bg-slate-900 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 absolute">
            OR QUICK ACCESS
          </span>
        </div>

        {/* Instant 1-Click Demo Access Button */}
        <button
          onClick={handleInstantDemo}
          className="w-full py-3 px-4 rounded-2xl bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-emerald-900/60 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{t.demoSignInBtn}</span>
        </button>

        {/* Toggle Sign Up / Sign In Mode */}
        <div className="text-center pt-2">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs font-semibold text-slate-400 hover:text-emerald-400 transition"
          >
            {isSignUp ? t.hasAccount : t.noAccount}{' '}
            <span className="text-emerald-400 underline ml-1 font-bold">
              {isSignUp ? t.signInBtn : t.signUpBtn}
            </span>
          </button>
        </div>

      </div>

      <footer className="mt-8 text-center text-[11px] text-slate-600 font-medium">
        Payir Precision Agriculture Telemetry & Security &bull; Powered by Supabase & React
      </footer>

    </div>
  );
};
