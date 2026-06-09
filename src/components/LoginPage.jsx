import React, { useState } from 'react';
import { Cpu, User, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please provide both Transmitter ID and access code.');
      return;
    }

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication error.');
      }

      onLogin(data.email, data.role);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleShortcutLogin = async (presetEmail, role) => {
    setEmail(presetEmail);
    const presetPassword = role === 'admin' ? 'admin123' : 'user456';
    setPassword(presetPassword);
    setError(null);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: presetEmail, password: presetPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      onLogin(data.email, data.role);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans" id="auth-panel-stage">
      <div className="absolute inset-0 bg-[#f1f5f9] dark:bg-[#0c0714] bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 animate-pulse" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10 space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-white dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-800 text-blue-600 rounded-2xl shadow-sm">
            <Cpu className="w-8 h-8 animate-pulse text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Robros IoT Node Platform
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Wired mesh transmitter node network with relational SQL memory database.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-lg">
          
          <div className="text-center mb-6">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              SYSTEM PORT AUTHORIZATION
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-400 rounded-lg flex items-start gap-2.5 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                Transmitter User ID / Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. vaishakh884"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                Transmitter Access Code
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter secure access password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 active:opacity-90 transition-all text-white font-bold text-xs rounded-lg shadow-xs uppercase tracking-wider cursor-pointer font-sans"
            >
              Sign In to Mesh Hub
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-5 space-y-3">
            <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider text-center">
              Sign In Instantly via SQL preset
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleShortcutLogin('vaishakh884@gmail.com', 'user')}
                className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-950 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-900 rounded-lg text-left transition-all active:scale-[0.97] cursor-pointer group"
              >
                <div className="p-1 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold uppercase shrink-0">
                  User
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 truncate">
                    vaishakh884
                  </div>
                  <div className="text-[9px] text-slate-500 truncate leading-none mt-0.5">
                    Operator profile (user456)
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleShortcutLogin('admin@robros.io', 'admin')}
                className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-950 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-900 rounded-lg text-left transition-all active:scale-[0.97] cursor-pointer group"
              >
                <div className="p-1 bg-indigo-100 text-indigo-800 rounded text-[9px] font-bold uppercase shrink-0">
                  Admin
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 truncate">
                    admin@robros.io
                  </div>
                  <div className="text-[9px] text-slate-500 truncate leading-none mt-0.5">
                    Root admin profile (admin123)
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
