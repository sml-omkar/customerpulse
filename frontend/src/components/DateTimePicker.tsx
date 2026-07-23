import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar as CalendarIcon, ChevronDown, ChevronUp } from "lucide-react";

// NOTE(added): native <input type="datetime-local"> was rendering
// differently in every browser - Chrome on macOS shows a big calendar
// overlay, Firefox shows plain up/down spinners, Chrome on Windows shows
// yet another calendar style. This component replaces it with one
// self-built picker that looks and behaves identically everywhere.
//
// It's a drop-in replacement: value/onChange still use the exact same
// "YYYY-MM-DDTHH:mm" (local time, 24h) string that <input type="datetime-local">
// used, so callers (and `new Date(value)` at submit time) don't need to change.

const pad2 = (n: number) => String(n).padStart(2, "0");

const parseValue = (value: string): Date | null => {
  if (!value) return null;
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) return null;
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);
  if ([y, m, d, hh, mm].some((n) => Number.isNaN(n))) return null;
  return new Date(y, m - 1, d, hh, mm, 0, 0);
};

const formatValue = (date: Date): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

const formatDisplay = (date: Date): string => {
  const dd = pad2(date.getDate());
  const mm = pad2(date.getMonth() + 1);
  const yyyy = date.getFullYear();
  let h12 = date.getHours() % 12;
  if (h12 === 0) h12 = 12;
  const meridiem = date.getHours() >= 12 ? "PM" : "AM";
  return `${dd}/${mm}/${yyyy}, ${pad2(h12)}:${pad2(date.getMinutes())} ${meridiem}`;
};

// Builds a full 7-wide grid (including the trailing/leading days of the
// adjacent months, greyed out) for the given month - same shape as the
// screenshot's calendar.
const getCalendarCells = (year: number, month: number) => {
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;
  const cells: { day: number; offset: -1 | 0 | 1 }[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - firstDayOfWeek + 1;
    if (dayNum < 1) cells.push({ day: daysInPrevMonth + dayNum, offset: -1 });
    else if (dayNum > daysInMonth) cells.push({ day: dayNum - daysInMonth, offset: 1 });
    else cells.push({ day: dayNum, offset: 0 });
  }
  return cells;
};

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
const MINUTES_60 = Array.from({ length: 60 }, (_, i) => i); // 0-59

interface DateTimePickerProps {
  value: string; // "YYYY-MM-DDTHH:mm", or "" for unset
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export const DateTimePicker = ({ value, onChange, className, placeholder = "Select date & time" }: DateTimePickerProps) => {
  const [open, setOpen] = useState(false);
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => parseValue(value), [value]);
  const [viewYear, setViewYear] = useState(() => (selected ?? new Date()).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => (selected ?? new Date()).getMonth());

  // Same outside-click-to-close pattern used by MultiSelectDropdown in AdvancedTicketFilters.tsx.
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowMonthYearPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset the visible month to wherever the current value (or today) is
  // every time the panel opens, and scroll the hour/minute columns so the
  // current selection is in view without the user having to scroll to find it.
  useEffect(() => {
    if (!open) return;
    const base = selected ?? new Date();
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    const scrollToIndex = (ref: React.RefObject<HTMLDivElement>, index: number) => {
      const item = ref.current?.children[index] as HTMLElement | undefined;
      item?.scrollIntoView({ block: "center" });
    };
    const h12 = selected ? (selected.getHours() % 12 === 0 ? 12 : selected.getHours() % 12) : 12;
    scrollToIndex(hourListRef, h12 - 1);
    scrollToIndex(minuteListRef, selected ? selected.getMinutes() : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const commit = (next: Date) => onChange(formatValue(next));

  // Falls back to "now" (kept on the currently-viewed month) when nothing's picked yet.
  const baseDate = () => selected ?? new Date(viewYear, viewMonth, new Date().getDate());

  const handleDayClick = (day: number, offset: -1 | 0 | 1) => {
    let y = viewYear;
    let m = viewMonth + offset;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    const base = baseDate();
    commit(new Date(y, m, day, base.getHours(), base.getMinutes()));
    if (offset !== 0) { setViewYear(y); setViewMonth(m); }
  };

  const handleHourClick = (h12: number) => {
    const base = baseDate();
    const isPM = base.getHours() >= 12;
    const h24 = (h12 % 12) + (isPM ? 12 : 0);
    const next = new Date(base);
    next.setHours(h24);
    commit(next);
  };

  const handleMinuteClick = (minute: number) => {
    const next = new Date(baseDate());
    next.setMinutes(minute);
    commit(next);
  };

  const handleMeridiemClick = (meridiem: "AM" | "PM") => {
    const base = baseDate();
    const h12 = base.getHours() % 12;
    const next = new Date(base);
    next.setHours(meridiem === "PM" ? h12 + 12 : h12);
    commit(next);
  };

  const handleToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    commit(now);
  };

  const handleClear = () => {
    onChange("");
    setOpen(false);
  };

  const cells = getCalendarCells(viewYear, viewMonth);
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleString("en-US", { month: "long" });
  const today = new Date();
  const selectedHour12 = selected ? (selected.getHours() % 12 === 0 ? 12 : selected.getHours() % 12) : null;
  const selectedMeridiem = selected ? (selected.getHours() >= 12 ? "PM" : "AM") : null;

  return (
    <div className={`relative ${className ?? ""}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 text-xs p-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-left cursor-pointer"
      >
        <span className={selected ? "text-slate-700" : "text-slate-400"}>{selected ? formatDisplay(selected) : placeholder}</span>
        <CalendarIcon size={14} className="text-slate-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-3 flex gap-3 w-[330px]">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setShowMonthYearPicker((s) => !s)}
                className="text-xs font-bold text-slate-900 flex items-center gap-1 cursor-pointer hover:text-blue-600"
              >
                {monthLabel} {viewYear}
                <ChevronDown size={12} />
              </button>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() => { let m = viewMonth - 1, y = viewYear; if (m < 0) { m = 11; y -= 1; } setViewMonth(m); setViewYear(y); }}
                  className="p-1 rounded hover:bg-slate-100 cursor-pointer text-slate-500"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() => { let m = viewMonth + 1, y = viewYear; if (m > 11) { m = 0; y += 1; } setViewMonth(m); setViewYear(y); }}
                  className="p-1 rounded hover:bg-slate-100 cursor-pointer text-slate-500"
                >
                  <ChevronDown size={14} />
                </button>
              </div>
            </div>

            {showMonthYearPicker ? (
              <div className="grid grid-cols-2 gap-2 py-6">
                <select
                  value={viewMonth}
                  onChange={(e) => setViewMonth(Number(e.target.value))}
                  className="text-xs border border-slate-200 rounded-lg p-1.5 cursor-pointer"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>{new Date(2000, i, 1).toLocaleString("en-US", { month: "long" })}</option>
                  ))}
                </select>
                <select
                  value={viewYear}
                  onChange={(e) => setViewYear(Number(e.target.value))}
                  className="text-xs border border-slate-200 rounded-lg p-1.5 cursor-pointer"
                >
                  {Array.from({ length: 21 }, (_, i) => today.getFullYear() - 10 + i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-slate-400 mb-1">
                  {WEEKDAY_LABELS.map((d, i) => <div key={i}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
                  {cells.map((c, i) => {
                    const isSelected =
                      !!selected && c.offset === 0 &&
                      selected.getFullYear() === viewYear && selected.getMonth() === viewMonth && selected.getDate() === c.day;
                    const isToday =
                      c.offset === 0 &&
                      today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === c.day;
                    return (
                      <button
                        type="button"
                        key={i}
                        onClick={() => handleDayClick(c.day, c.offset)}
                        className={[
                          "w-7 h-7 mx-auto rounded-md flex items-center justify-center cursor-pointer transition-colors",
                          isSelected ? "bg-blue-600 text-white font-bold" : c.offset !== 0 ? "text-slate-300 hover:bg-slate-50" : "text-slate-700 hover:bg-slate-100",
                          isToday && !isSelected ? "ring-1 ring-inset ring-blue-300" : "",
                        ].join(" ")}
                      >
                        {c.day}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
              <button type="button" onClick={handleClear} className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer">Clear</button>
              <button type="button" onClick={handleToday} className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer">Today</button>
            </div>
          </div>

          <div className="flex gap-1.5 border-l border-slate-100 pl-2.5 shrink-0">
            <div ref={hourListRef} className="h-40 overflow-y-auto w-8 text-center space-y-1 scroll-smooth">
              {HOURS_12.map((h) => (
                <button
                  type="button"
                  key={h}
                  onClick={() => handleHourClick(h)}
                  className={`w-7 h-6 mx-auto rounded flex items-center justify-center text-xs cursor-pointer ${selectedHour12 === h ? "bg-blue-600 text-white font-bold" : "text-slate-700 hover:bg-slate-100"}`}
                >
                  {pad2(h)}
                </button>
              ))}
            </div>
            <div ref={minuteListRef} className="h-40 overflow-y-auto w-8 text-center space-y-1 scroll-smooth">
              {MINUTES_60.map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => handleMinuteClick(m)}
                  className={`w-7 h-6 mx-auto rounded flex items-center justify-center text-xs cursor-pointer ${selected?.getMinutes() === m ? "bg-blue-600 text-white font-bold" : "text-slate-700 hover:bg-slate-100"}`}
                >
                  {pad2(m)}
                </button>
              ))}
            </div>
            <div className="w-9 text-center space-y-1">
              {(["AM", "PM"] as const).map((mer) => (
                <button
                  type="button"
                  key={mer}
                  onClick={() => handleMeridiemClick(mer)}
                  className={`w-9 h-6 mx-auto rounded flex items-center justify-center text-xs cursor-pointer ${selectedMeridiem === mer ? "bg-blue-600 text-white font-bold" : "text-slate-700 hover:bg-slate-100"}`}
                >
                  {mer}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateTimePicker;
