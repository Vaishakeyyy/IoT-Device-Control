import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Clock, Moon } from 'lucide-react';

export const SchedulePlan = ({
  rules,
  devices,
  onToggleRule,
  onAddRule,
  onDeleteRule,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState('time');
  const [triggerDetail, setTriggerDetail] = useState('20:00');
  const [targetDeviceId, setTargetDeviceId] = useState(devices[0]?.id || '');
  const [action, setAction] = useState('turn_on');
  const [actionValue, setActionValue] = useState(100);
  const [selectedDays, setSelectedDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handleSubmit = (e) => {
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

    setName('');
    setShowAddForm(false);
  };

  const handleDayToggle = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const getActionPhrase = (rule) => {
    const dev = devices.find((d) => d.id === rule.targetDeviceId);
    const label = dev ? dev.name : 'Device';
    if (rule.action === 'turn_on') return `Power ON ${label}`;
    if (rule.action === 'turn_off') return `Power OFF ${label}`;
    return `Set ${label} to ${rule.actionValue || 0}${dev?.metricUnit || '%'}`;
  };

  return (
    <div className="bg-white border border-[#e2e8f0] text-slate-800 rounded-xl p-5 shadow-xs h-full animate-fade-in" id="schedule-plan-pane">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-sans font-bold text-slate-800 text-sm">Automation Rules</h3>
          <p className="text-[11px] text-slate-500 font-sans">Set scheduled event triggers for connected nodes.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1 px-2 py-1.5 bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          id="btn-add-rule-toggle"
        >
          <Plus className="w-3.5 h-3.5" />
          {showAddForm ? 'Cancel' : 'New Rule'}
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="border-b border-slate-100 pb-4 pt-3.5 space-y-3 overflow-hidden text-xs"
            id="add-automation-form"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 font-sans mb-1 uppercase tracking-wider">
                  Rule Identifier
                </label>
                <input
                  type="text"
                  placeholder="e.g. Living Room Lights Dusk Trigger"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs font-sans px-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 font-sans mb-1 uppercase tracking-wider">
                  Target IoT Node
                </label>
                <select
                  value={targetDeviceId}
                  onChange={(e) => setTargetDeviceId(e.target.value)}
                  className="w-full text-xs font-sans px-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {devices.map((d) => (
                    <option key={d.id} value={d.id} className="text-slate-800">
                      [{d.room}] {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 font-sans mb-1 uppercase tracking-wider">
                  Trigger Time
                </label>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="time"
                    value={triggerDetail}
                    onChange={(e) => setTriggerDetail(e.target.value)}
                    className="w-full text-xs font-sans pl-8 pr-2.5 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 font-sans mb-1 uppercase tracking-wider">
                  Command
                </label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full text-xs font-sans px-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-lg focus:outline-none"
                >
                  <option value="turn_on">Power ON</option>
                  <option value="turn_off">Power OFF</option>
                  <option value="set_value">Set Specified Level</option>
                </select>
              </div>

              {action === 'set_value' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 font-sans mb-1 uppercase tracking-wider">
                    Value
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={actionValue}
                    onChange={(e) => setActionValue(parseInt(e.target.value) || 0)}
                    className="w-full text-xs font-sans px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-lg focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div>
              <span className="block text-[10px] font-bold text-slate-600 font-sans mb-1 uppercase tracking-wider">
                Repeat Days
              </span>
              <div className="flex flex-wrap gap-1">
                {DAYS.map((day) => {
                  const isChecked = selectedDays.includes(day);
                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() => handleDayToggle(day)}
                      className={`text-[10px] px-2 py-0.5 rounded font-bold border font-sans cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-2.5 py-1 text-slate-500 hover:text-slate-800 font-sans font-bold cursor-pointer"
              >
                Clear
              </button>
              <button
                type="submit"
                className="px-3.5 py-1 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-500 transition-colors cursor-pointer"
              >
                Register Rule
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="mt-4 space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
        {rules.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs italic font-sans">
            No schedule rules configured. Add a rule above to automate.
          </div>
        ) : (
          rules.map((rule) => (
            <motion.div
              layout
              key={rule.id}
              whileHover={{ scale: 1.01, zIndex: 20, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)" }}
              transition={{ type: "tween", duration: 0.25 }}
              className={`relative isolate flex items-start justify-between p-3 rounded-lg border transition-all duration-150 ${
                rule.isEnabled 
                  ? 'bg-slate-50 border-slate-200 text-slate-800' 
                  : 'bg-slate-50/50 border-slate-200/50 opacity-45 text-slate-400'
              }`}
              id={`automation-rule-${rule.id}`}
            >
              <div className="space-y-1 pr-3 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`font-sans font-bold text-xs truncate ${rule.isEnabled ? 'text-slate-800' : 'text-slate-400'}`}>
                    {rule.name}
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-[9px] text-slate-500 bg-white border border-slate-200 rounded-md px-1 py-0.5 shrink-0">
                    <Clock className="w-2.5 h-2.5 text-slate-400" />
                    {rule.triggerDetail}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-sans">
                  Action: <strong className={`${rule.isEnabled ? 'text-slate-705' : 'text-slate-400'} font-semibold`}>{getActionPhrase(rule)}</strong>
                </p>

                <div className="flex gap-0.5 pt-1">
                  {DAYS.map((day) => {
                    const active = rule.days.includes(day);
                    return (
                      <span
                        key={day}
                        className={`text-[8px] font-sans font-bold px-1 rounded-sm ${
                          active
                            ? 'text-blue-600 bg-blue-50 border border-blue-200'
                            : 'text-slate-300 bg-transparent'
                        }`}
                      >
                        {day[0]}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onToggleRule(rule.id)}
                  className={`w-8 h-4.5 rounded-full relative transition-colors duration-200 cursor-pointer ${
                    rule.isEnabled ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                  type="button"
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full transition-transform duration-205 shadow-xs ${
                      rule.isEnabled ? 'translate-x-3.5' : 'translate-x-0'
                    }`}
                  ></span>
                </button>
                <button
                  onClick={() => onDeleteRule(rule.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent rounded-md transition-colors cursor-pointer"
                  title="Remove rule"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
        <span className="text-[9px] block font-bold text-slate-400 uppercase tracking-wider font-sans">
          Recommended Automation Preset
        </span>
        <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center gap-2 min-w-0">
            <div className="bg-amber-100 border border-amber-200 text-amber-800 p-1.5 rounded-md shrink-0 animate-pulse">
              <Moon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-800 font-sans truncate leading-none">
                Eco Sleep Standby
              </p>
              <p className="text-[9px] text-slate-500 font-sans truncate mt-1 leading-none">
                Powers down non-essential sockets at 11:30 PM.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onAddRule({
                name: 'Eco Sleep Standby',
                triggerType: 'time',
                triggerDetail: '23:30',
                targetDeviceId: 'dev-3',
                action: 'turn_off',
                isEnabled: true,
                days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              });
            }}
            className="text-[9px] font-sans font-bold bg-white border border-slate-200 hover:border-slate-350 px-2 py-1.5 text-slate-650 rounded-md cursor-pointer transition-colors shadow-xs"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};
