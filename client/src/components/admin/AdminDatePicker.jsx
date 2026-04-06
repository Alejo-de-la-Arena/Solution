import { useEffect, useRef, useState } from 'react';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function toYMDLocal(d) {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${day}`;
}

export function parseYMD(s) {
  if (!s || typeof s !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const day = Number(m[3]);
  const dt = new Date(y, mo - 1, day);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== day) return null;
  return dt;
}

function monthLabel(year, monthIndex) {
  return new Date(year, monthIndex, 1).toLocaleDateString('es-AR', {
    month: 'long',
    year: 'numeric',
  });
}

/** Lunes = primera columna */
function mondayOffsetFirstOfMonth(year, monthIndex) {
  const dow = new Date(year, monthIndex, 1).getDay();
  return dow === 0 ? 6 : dow - 1;
}

const triggerBaseClass =
  'bg-[#0b0b0b] border border-white/20 rounded px-3 py-2 text-white text-sm focus:border-[rgb(0,255,255)] focus:outline-none focus:ring-1 focus:ring-[rgb(0,255,255)]/30';

/**
 * @param {object} props
 * @param {string} props.value YYYY-MM-DD o ''
 * @param {(ymd: string) => void} props.onChange
 * @param {string} [props.min]
 * @param {string} [props.max]
 * @param {string} [props.placeholder]
 * @param {string} [props.id]
 * @param {string} [props['aria-labelledby']]
 */
export function AdminDatePicker({ value, onChange, min, max, placeholder = 'Elegir fecha', id, 'aria-labelledby': ariaLabelledBy }) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [cursorYear, setCursorYear] = useState(() => new Date().getFullYear());
  const [cursorMonth, setCursorMonth] = useState(() => new Date().getMonth());

  useEffect(() => {
    if (!open) return;
    const d = parseYMD(value) || parseYMD(max) || parseYMD(min) || new Date();
    setCursorYear(d.getFullYear());
    setCursorMonth(d.getMonth());
  }, [open, value, max, min]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const displayText = value
    ? (() => {
        const d = parseYMD(value);
        return d
          ? d.toLocaleDateString('es-AR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : placeholder;
      })()
    : placeholder;

  const daysInMonth = new Date(cursorYear, cursorMonth + 1, 0).getDate();
  const pad = mondayOffsetFirstOfMonth(cursorYear, cursorMonth);
  const cells = [];
  for (let i = 0; i < pad; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);

  const isDisabledDay = (day) => {
    const ymd = toYMDLocal(new Date(cursorYear, cursorMonth, day));
    if (min && ymd < min) return true;
    if (max && ymd > max) return true;
    return false;
  };

  const selectDay = (day) => {
    if (isDisabledDay(day)) return;
    onChange(toYMDLocal(new Date(cursorYear, cursorMonth, day)));
    setOpen(false);
  };

  const goPrevMonth = () => {
    if (cursorMonth === 0) {
      setCursorYear((y) => y - 1);
      setCursorMonth(11);
    } else {
      setCursorMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (cursorMonth === 11) {
      setCursorYear((y) => y + 1);
      setCursorMonth(0);
    } else {
      setCursorMonth((m) => m + 1);
    }
  };

  const todayYMD = toYMDLocal(new Date());
  const canPickToday = (!min || todayYMD >= min) && (!max || todayYMD <= max);

  return (
    <div ref={rootRef} className="relative min-w-[168px]">
      <button
        type="button"
        id={id}
        aria-labelledby={ariaLabelledBy}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`${triggerBaseClass} w-full flex items-center justify-between gap-2 text-left cursor-pointer hover:border-white/35 transition-colors`}
      >
        <span className={value ? 'text-white' : 'text-white/45'}>{displayText}</span>
        <svg className="w-4 h-4 shrink-0 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5"
          />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Elegir fecha"
          className="absolute left-0 top-full z-50 mt-1 w-[min(100vw-2rem,280px)] rounded-lg border border-white/20 bg-[#0f0f0f] p-3 shadow-[0_12px_40px_rgba(0,0,0,0.65)]"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <button
              type="button"
              onClick={goPrevMonth}
              className="p-1.5 rounded border border-white/15 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Mes anterior"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <span className="text-sm text-white/90 capitalize flex-1 text-center font-medium truncate px-1">
              {monthLabel(cursorYear, cursorMonth)}
            </span>
            <button
              type="button"
              onClick={goNextMonth}
              className="p-1.5 rounded border border-white/15 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Mes siguiente"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center text-[10px] uppercase tracking-wider text-white/40 py-1">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, idx) =>
              day == null ? (
                <div key={`e-${idx}`} className="aspect-square" />
              ) : (
                <button
                  key={day}
                  type="button"
                  disabled={isDisabledDay(day)}
                  onClick={() => selectDay(day)}
                  className={`aspect-square rounded text-sm transition-colors flex items-center justify-center
                    ${isDisabledDay(day) ? 'text-white/20 cursor-not-allowed' : 'text-white/90 hover:bg-[rgb(0,255,255)]/15 hover:text-[rgb(0,255,255)]'}
                    ${
                      value === toYMDLocal(new Date(cursorYear, cursorMonth, day))
                        ? 'bg-[rgb(0,255,255)]/20 text-[rgb(0,255,255)] font-semibold ring-1 ring-[rgb(0,255,255)]/40'
                        : ''
                    }
                  `}
                >
                  {day}
                </button>
              )
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
            {canPickToday && (
              <button
                type="button"
                onClick={() => {
                  onChange(todayYMD);
                  setOpen(false);
                }}
                className="text-xs uppercase tracking-wider text-[rgb(0,255,255)]/90 hover:text-[rgb(0,255,255)] px-2 py-1 rounded border border-[rgb(0,255,255)]/30 hover:bg-[rgb(0,255,255)]/10"
              >
                Hoy
              </button>
            )}
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setOpen(false);
                }}
                className="text-xs uppercase tracking-wider text-white/50 hover:text-white/80 px-2 py-1"
              >
                Quitar filtro
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
