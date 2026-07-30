import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  History, 
  Calendar as CalendarIcon, 
  X, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  ExternalLink,
  CheckCircle2,
  XCircle,
  Eye
} from 'lucide-react';
import { useRunnerStore } from '@/lib/store';
import { HistoryItem, getLocalDateString } from '@/lib/types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose }) => {
  const { tabHistory, clearTabHistory, openWorkbenchTab } = useRunnerStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Selected date state for interactive calendar (defaults to today YYYY-MM-DD in local time)
  const todayStr = useMemo(() => getLocalDateString(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());

  const methodColors: Record<string, string> = {
    GET:    'bg-emerald-950/80 text-emerald-300 border-emerald-800',
    POST:   'bg-amber-950/80 text-amber-300 border-amber-800',
    PUT:    'bg-indigo-950/80 text-indigo-300 border-indigo-800',
    DELETE: 'bg-rose-950/80 text-rose-300 border-rose-800',
    PATCH:  'bg-purple-950/80 text-purple-300 border-purple-800',
    HEAD:   'bg-cyan-950/80 text-cyan-300 border-cyan-800',
    OPTIONS:'bg-slate-800 text-slate-300 border-slate-700',
  };

  // Calendar month calculation
  const { year, month, daysInMonth, startDayOfWeek, monthName } = useMemo(() => {
    const y = currentMonthDate.getFullYear();
    const m = currentMonthDate.getMonth();
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);
    const mName = currentMonthDate.toLocaleString('default', { month: 'long' });

    return {
      year: y,
      month: m,
      daysInMonth: lastDay.getDate(),
      startDayOfWeek: firstDay.getDay(),
      monthName: mName,
    };
  }, [currentMonthDate]);

  // Dates in current month that have history records
  const datesWithHistory = useMemo(() => {
    const set = new Set<string>();
    tabHistory.forEach(h => set.add(h.dateStr));
    return set;
  }, [tabHistory]);

  // Filter history items by selected date
  const filteredHistory = useMemo(() => {
    if (!selectedDate) return tabHistory;
    return tabHistory.filter(h => h.dateStr === selectedDate);
  }, [tabHistory, selectedDate]);

  if (!isOpen || !mounted) return null;

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const handleOpenItem = (item: HistoryItem) => {
    openWorkbenchTab(item.endpointId);
    
    // Smooth scroll to workbench
    const workbenchEl = document.getElementById('endpoint-workbench-panel');
    if (workbenchEl) {
      const rect = workbenchEl.getBoundingClientRect();
      const headerOffset = 20;
      const targetY = window.scrollY + rect.top - headerOffset;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }
    
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl rounded-3xl border border-slate-800 bg-[#090d16] text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] my-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-indigo-950/80 border border-indigo-800 text-indigo-400">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white flex items-center gap-2">
                <span>Tab Usage History</span>
                <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  {tabHistory.length} total entries
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Select a date on the calendar to view tabs opened or executed on that day
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {tabHistory.length > 0 && (
              <button
                type="button"
                onClick={clearTabHistory}
                className="px-3 py-1.5 rounded-xl border border-rose-900/80 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear History</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Content: Grid layout (Calendar Left + History Right) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6 custom-scrollbar">
          
          {/* LEFT: Interactive Calendar Picker (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 shadow-inner">
              
              {/* Calendar Month & Year Header with Dropdowns */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-1.5 font-mono">
                  <CalendarIcon className="h-4 w-4 text-indigo-400 shrink-0" />
                  
                  {/* Month Dropdown */}
                  <select
                    value={month}
                    onChange={(e) => {
                      const newM = parseInt(e.target.value);
                      setCurrentMonthDate(new Date(year, newM, 1));
                    }}
                    className="bg-slate-900 border border-slate-700/80 text-indigo-300 text-xs font-bold font-mono rounded-xl px-2 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer hover:bg-slate-800 transition-colors"
                  >
                    {[
                      'January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'
                    ].map((mName, idx) => (
                      <option key={mName} value={idx} className="bg-slate-900 text-slate-200 font-mono">
                        {mName}
                      </option>
                    ))}
                  </select>

                  {/* Year Dropdown */}
                  <select
                    value={year}
                    onChange={(e) => {
                      const newY = parseInt(e.target.value);
                      setCurrentMonthDate(new Date(newY, month, 1));
                    }}
                    className="bg-slate-900 border border-slate-700/80 text-indigo-300 text-xs font-bold font-mono rounded-xl px-2 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer hover:bg-slate-800 transition-colors"
                  >
                    {Array.from({ length: 15 }).map((_, idx) => {
                      const yVal = 2020 + idx;
                      return (
                        <option key={yVal} value={yVal} className="bg-slate-900 text-slate-200 font-mono">
                          {yVal}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
                    title="Previous Month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      setCurrentMonthDate(now);
                      setSelectedDate(getLocalDateString(now));
                    }}
                    className="px-2 py-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-[10px] font-mono font-bold text-indigo-400 transition-colors cursor-pointer"
                    title="Jump to Today"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
                    title="Next Month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Days of Week Header */}
              <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] text-slate-500 font-bold mb-2">
                <span>SU</span><span>MO</span><span>TU</span><span>WE</span><span>TH</span><span>FR</span><span>SA</span>
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells before start of month */}
                {Array.from({ length: startDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-9" />
                ))}

                {/* Days of month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const monthFormatted = String(month + 1).padStart(2, '0');
                  const dayFormatted = String(dayNum).padStart(2, '0');
                  const dateString = `${year}-${monthFormatted}-${dayFormatted}`;
                  
                  const isSelected = selectedDate === dateString;
                  const isToday = todayStr === dateString;
                  const hasHistory = datesWithHistory.has(dateString);

                  return (
                    <button
                      key={dateString}
                      type="button"
                      onClick={() => setSelectedDate(dateString)}
                      className={`h-9 rounded-xl flex flex-col items-center justify-center relative font-mono text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 ring-2 ring-indigo-400 scale-105'
                          : isToday
                          ? 'bg-indigo-950/80 border border-indigo-700 text-indigo-300'
                          : 'bg-slate-900/60 border border-slate-800/40 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span>{dayNum}</span>
                      
                      {/* Active History Indicator Dot */}
                      {hasHistory && (
                        <span className={`h-1.5 w-1.5 rounded-full absolute bottom-1 ${
                          isSelected ? 'bg-white' : 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                        }`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Filter Info & Direct Date Input */}
            <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-900/40 text-xs font-mono text-indigo-300 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span>Selected Date: <strong className="text-white">{selectedDate || 'All Dates'}</strong></span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(e.target.value);
                      const parts = e.target.value.split('-');
                      if (parts.length === 3) {
                        setCurrentMonthDate(new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1));
                      }
                    }
                  }}
                  className="bg-slate-900 border border-slate-700/80 text-indigo-300 text-[11px] font-mono font-bold rounded-lg px-2 py-0.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  title="Pick a custom date directly"
                />
              </div>

              {selectedDate && (
                <button 
                  type="button" 
                  onClick={() => setSelectedDate('')}
                  className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Show All
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: History List for Selected Date (7 cols) */}
          <div className="md:col-span-7 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm font-mono text-slate-200 flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-400" />
                <span>Entries for {selectedDate ? selectedDate : 'All Time'}</span>
                <span className="text-xs font-normal text-slate-500 font-mono">({filteredHistory.length})</span>
              </h3>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 text-center space-y-2">
                <CalendarIcon className="h-10 w-10 text-slate-600 mb-1 animate-bounce" />
                <p className="font-bold text-sm text-slate-400">No History for this Date</p>
                <p className="text-xs text-slate-500 font-mono">
                  Open or execute endpoints in the workbench to track your daily history automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[460px] overflow-y-auto custom-scrollbar pr-1">
                {filteredHistory.map((item) => {
                  const timeFormatted = new Date(item.timestamp).toLocaleTimeString();
                  
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleOpenItem(item)}
                      className="group p-3 rounded-2xl border border-slate-800/80 bg-slate-900/50 hover:bg-slate-900 hover:border-indigo-500/80 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Method Badge */}
                        <span className={`px-2 py-0.5 rounded-lg border font-mono text-[10px] font-extrabold shrink-0 ${methodColors[item.method] || 'bg-slate-800 text-slate-300'}`}>
                          {item.method}
                        </span>

                        {/* Name & Time */}
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-slate-200 group-hover:text-indigo-300 truncate transition-colors">
                            {item.endpointName}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-slate-600" />
                              {timeFormatted}
                            </span>
                            <span>•</span>
                            <span>{item.dateStr}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action & Status */}
                      <div className="flex items-center gap-2 shrink-0">
                        {item.status === 'passed' && (
                          <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
                            <CheckCircle2 className="h-3 w-3" /> {item.statusCode || 200} OK
                          </span>
                        )}
                        {item.status === 'failed' && (
                          <span className="flex items-center gap-1 text-[10px] font-mono text-rose-400 font-bold bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-800">
                            <XCircle className="h-3 w-3" /> {item.statusCode || 'FAIL'}
                          </span>
                        )}
                        {item.status === 'opened' && (
                          <span className="flex items-center gap-1 text-[10px] font-mono text-indigo-400 font-bold bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-800">
                            <Eye className="h-3 w-3" /> Opened
                          </span>
                        )}

                        <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400 group-hover:text-white group-hover:bg-indigo-600 transition-all">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
