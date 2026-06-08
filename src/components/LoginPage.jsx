import React, { useState } from 'react';
import { Compass, User, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide a valid email register.');
      return;
    }

    const isEmailAdmin = email.toLowerCase().includes('admin');
    const role = isEmailAdmin ? 'admin' : 'user';

    onLogin(email, role);
  };

  const handleShortcutLogin = (presetEmail, role) => {
    setEmail(presetEmail);
    setPassword(role === 'admin' ? 'admin123' : 'user456');
    setError(null);
    setTimeout(() => {
      onLogin(presetEmail, role);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans" id="auth-panel-stage">
      <div className="absolute inset-0 bg-[#f1f5f9] bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 animate-pulse" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10 space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-white border border-[#e2e8f0] text-blue-600 rounded-2xl shadow-sm">
            <Compass className="w-8 h-8 animate-spin-slow" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Synapse IoT Node Platform
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Wired mesh transmitter node network. Please sign in to access telemetry relays and live monitor statistics.
          </p>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 sm:p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-start gap-2.5 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                Transmitter Email Address
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="e.g. vaishakh884@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-250 text-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
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
                  className="w-full text-xs pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-250 text-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400"
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
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs uppercase tracking-wider cursor-pointer"
            >
              Sign In to Mesh Hub
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-5 space-y-3">
            <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider text-center">
              Sign In Instantly via Role preset
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleShortcutLogin('vaishakh884@gmail.com', 'user')}
                className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-250 rounded-lg text-left transition-colors cursor-pointer group"
              >
                <div className="p-1 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold uppercase shrink-0">
                  User
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-800 group-hover:text-emerald-700 truncate">
                    vaishakh884
                  </div>
                  <div className="text-[9px] text-slate-500 truncate leading-none mt-0.5">
                    Operator profile
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleShortcutLogin('admin@synapse.io', 'admin')}
                className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-250 rounded-lg text-left transition-colors cursor-pointer group"
              >
                <div className="p-1 bg-indigo-100 text-indigo-800 rounded text-[9px] font-bold uppercase shrink-0">
                  Admin
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-700 truncate">
                    admin@synapse.io
                  </div>
                  <div className="text-[9px] text-slate-500 truncate leading-none mt-0.5">
                    Root admin profile
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
