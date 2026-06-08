import React, { useState } from 'react';
import { AutomationRule, IoTDevice } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Calendar, Clock, Volume2, Lightbulb, Play, Moon, Shield } from 'lucide-react';

interface SchedulePlanProps {
  rules: AutomationRule[];
  devices: IoTDevice[];
  onToggleRule: (id: string) => void;
  onAddRule: (rule: Omit<AutomationRule, 'id'>) => void;
  onDeleteRule: (id: string) => void;
}

export const SchedulePlan: React.FC<SchedulePlanProps> = ({
  rules,
  devices,
  onToggleRule,
  onAddRule,
  onDeleteRule,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState<'time' | 'sensor'>('time');
  const [triggerDetail, setTriggerDetail] = useState('20:00');
  const [targetDeviceId, setTargetDeviceId] = useState(devices[0]?.id || '');
  const [action, setAction] = useState<'turn_on' | 'turn_off' | 'set_value'>('turn_on');
  const [actionValue, setActionValue] = useState(100);
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetDeviceId) return;

    onAddRule({
      name,
      triggerType,
      triggerDetail,
      targetDeviceId,
      action,
      actionValue: action === 'set_value' ? actionValue : undefined,
      isEnabled: true,
      days: selectedDays,
    });

    // Reset Form
    setName('');
    setShowAddForm(false);
  };

  const handleDayToggle = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const getDeviceName = (id: string) => {
    const dev = devices.find((d) => d.id === id);
    return dev ? dev.name : 'Unknown Device';
  };

  const getActionPhrase = (rule: AutomationRule) => {
    const dev = devices.find((d) => d.id === rule.targetDeviceId);
    const label = dev ? dev.name : 'Device';
    if (rule.action === 'turn_on') return `Power ON ${label}`;
    if (rule.action === 'turn_off') return `Power OFF ${label}`;
    return `Set ${label} to ${rule.actionValue || 0}${dev?.metricUnit || '%'}`;
  };

  return (
    <div className="bg-[#151518] border border-[#222227] text-white/90 rounded-2xl p-6 shadow-md h-full" id="schedule-plan-pane">
      <div className="flex items-center justify-between pb-4 border-b border-[#222227]">
        <div>
          <h3 className="font-sans font-bold text-white text-lg">Automation Rules</h3>
          <p className="text-xs text-zinc-400 font-sans">Set macro timetables for connected nodes.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 text-white border border-[#3f3f46] hover:bg-zinc-700 text-xs font-sans font-semibold rounded-xl transition-all cursor-pointer shadow-xs"
          id="btn-add-rule-toggle"
        >
          <Plus className="w-4 h-4" />
          {showAddForm ? 'Cancel' : 'New Rule'}
        </button>
      </div>

      {/* Accordion / Dropdown Create Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            onSubmit={handleSubmit}
            className="border-b border-[#222227] pb-5 pt-4 space-y-4 overflow-hidden"
            id="add-automation-form"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 font-sans mb-1">
                  Rule Identifier
                </label>
                <input
                  type="text"
                  placeholder="e.g. Backyard Lamp Sprinkler Dusk Check"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs font-sans px-3 py-2 bg-[#0c0c0e] border border-[#222227] text-zinc-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-650"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 font-sans mb-1">
                  Target IoT Node
                </label>
                <select
                  value={targetDeviceId}
                  onChange={(e) => setTargetDeviceId(e.target.value)}
                  className="w-full text-xs font-sans px-3 py-2 bg-[#0c0c0e] border border-[#222227] text-zinc-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-650"
                >
                  {devices.map((d) => (
                    <option key={d.id} value={d.id} className="bg-[#151518] text-white">
                      [{d.room}] {d.name} ({d.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 font-sans mb-1">
                  Trigger Interval Time
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="time"
                    value={triggerDetail}
                    onChange={(e) => setTriggerDetail(e.target.value)}
                    className="w-full text-xs font-sans pl-9 pr-3 py-2 bg-[#0c0c0e] border border-[#222227] text-zinc-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-650"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 font-sans mb-1">
                  Trigger Command
                </label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value as any)}
                  className="w-full text-xs font-sans px-3 py-2 bg-[#0c0c0e] border border-[#222227] text-zinc-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-650"
                >
                  <option value="turn_on" className="bg-[#151518] text-white">Power ON</option>
                  <option value="turn_off" className="bg-[#151518] text-white">Power OFF</option>
                  <option value="set_value" className="bg-[#151518] text-white">Set Specified Level</option>
                </select>
              </div>

              {action === 'set_value' && (
                <div>
                  <label className="block text-xs font-medium text-zinc-400 font-sans mb-1">
                    Value to Dispatch
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={actionValue}
                    onChange={(e) => setActionValue(parseInt(e.target.value) || 0)}
                    className="w-full text-xs font-sans px-3 py-1.5 bg-[#0c0c0e] border border-[#222227] text-zinc-100 rounded-xl focus:outline-none focus:ring-1"
                  />
                </div>
              )}
            </div>

            {/* Day checklist */}
            <div>
              <span className="block text-xs font-medium text-zinc-400 font-sans mb-1.5">
                Active Repeat Days
              </span>
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map((day) => {
                  const isChecked = selectedDays.includes(day);
                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() => handleDayToggle(day)}
                      className={`text-xs px-3 py-1 rounded-lg font-medium border font-sans cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-white border-white text-black font-semibold shadow-sm'
                          : 'bg-[#0c0c0e] border-[#222227] text-zinc-400 hover:bg-[#151518]'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-zinc-400 hover:text-white cursor-pointer font-sans"
              >
                Clear
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all cursor-pointer shadow-xs"
              >
                Register Rule
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Rules list */}
      <div className="mt-4 space-y-3 max-h-[350px] overflow-y-auto pr-1">
        {rules.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-xs font-sans italic">
            No active automation rules compiled. Use &apos;New Rule&apos; above.
          </div>
        ) : (
          rules.map((rule) => (
            <motion.div
              layout
              key={rule.id}
              className={`flex items-start justify-between p-4 rounded-xl border transition-all duration-200 ${
                rule.isEnabled 
                  ? 'bg-[#0c0c0e] border-[#222227] opacity-100 text-white/90' 
                  : 'bg-[#0c0c0e]/40 border-[#222227]/70 opacity-50 text-zinc-500'
              }`}
              id={`automation-rule-${rule.id}`}
            >
              <div className="space-y-1 pr-4">
                <div className="flex items-center gap-2">
                  <span className={`font-sans font-semibold text-xs ${rule.isEnabled ? 'text-zinc-200' : 'text-zinc-500'}`}>
                    {rule.name}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[10px] text-zinc-400 bg-[#151518] border border-[#222227] rounded-md px-1.5 py-0.5">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    {rule.triggerDetail}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-sans">
                  Action: <strong className={`${rule.isEnabled ? 'text-zinc-100' : 'text-zinc-500'} font-medium`}>{getActionPhrase(rule)}</strong>
                </p>

                {/* Scheduled Days */}
                <div className="flex gap-1 pt-1.5">
                  {DAYS.map((day) => {
                    const active = rule.days.includes(day);
                    return (
                      <span
                        key={day}
                        className={`text-[9px] font-sans font-semibold px-1 rounded-sm ${
                          active
                            ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20'
                            : 'text-zinc-650 bg-transparent'
                        }`}
                      >
                        {day[0]}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Slider / Toggle Switch for Rule */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onToggleRule(rule.id)}
                  className={`w-9 h-5 rounded-full relative transition-colors duration-200 cursor-pointer ${
                    rule.isEnabled ? 'bg-indigo-550' : 'bg-[#222227]'
                  }`}
                  type="button"
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 shadow-sm ${
                      rule.isEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  ></span>
                </button>
                <button
                  onClick={() => onDeleteRule(rule.id)}
                  className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg transition-colors cursor-pointer"
                  title="Remove schedule rule"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Suggested macro block */}
      <div className="mt-5 pt-4 border-t border-[#222227] space-y-2">
        <span className="text-[10px] block font-semibold text-zinc-500 uppercase tracking-wider font-sans">
          Recommended Automation Preset
        </span>
        <div className="flex items-center justify-between p-3 bg-[#0c0c0e] border border-[#222227] rounded-xl">
          <div className="flex items-center gap-2.5">
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-1.5 rounded-lg">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-200 font-sans leading-tight">
                Standby Efficiency Preset
              </p>
              <p className="text-[10px] text-zinc-400 font-sans mt-0.5">
                Powers down non-critical plugs at 11:30 PM.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onAddRule({
                name: 'Efficiency Overlap Sleep',
                triggerType: 'time',
                triggerDetail: '23:30',
                targetDeviceId: 'dev-3',
                action: 'turn_off',
                isEnabled: true,
                days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              });
            }}
            className="text-[10px] bg-[#151518] border border-[#222227] hover:border-[#3f3f46] font-semibold px-2.5 py-1.5 text-zinc-300 rounded-lg cursor-pointer transition-colors shadow-xs"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};
