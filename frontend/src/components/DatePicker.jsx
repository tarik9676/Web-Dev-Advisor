import { useState, useRef, useEffect, useCallback } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDate(str) {
  if (!str) return null;
  const [year, month, day] = str.split('-').map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month - 1, day);
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(date, months) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function getDaysInMonth(date) {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const days = [];
  const firstDay = start.getDay();
  const prevMonthEnd = new Date(start.getFullYear(), start.getMonth(), 0).getDate();

  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: prevMonthEnd - i, isCurrentMonth: false, isToday: false });
  }

  for (let d = 1; d <= end.getDate(); d++) {
    const current = new Date(start.getFullYear(), start.getMonth(), d);
    days.push({
      day: d,
      isCurrentMonth: true,
      isToday: current.toDateString() === new Date().toDateString(),
      date: current,
    });
  }

  const remaining = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, isCurrentMonth: false, isToday: false });
  }

  return days;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  disabled = false,
  showTime = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? parseDate(value) || new Date() : new Date());
  const [inputValue, setInputValue] = useState(value || '');
  const [dropdownStyle, setDropdownStyle] = useState({});
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (value !== undefined) {
      setInputValue(value || '');
      if (value) {
        setViewDate(parseDate(value) || new Date());
      }
    }
  }, [value]);

  // Position dropdown
  useEffect(() => {
    if (!isOpen || !inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropdownStyle({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
    });
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleScroll = () => {
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  const handleSelectDay = (day) => {
    if (!day.isCurrentMonth) {
      setViewDate(addMonths(viewDate, day.day > 15 ? -1 : 1));
      return;
    }
    const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), day.day);
    const formatted = formatDate(selected);
    setInputValue(formatted);
    onChange?.(formatted);
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    const formatted = formatDate(today);
    setInputValue(formatted);
    onChange?.(formatted);
    setViewDate(today);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setInputValue('');
    onChange?.('');
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    const parsed = parseDate(val);
    if (parsed) setViewDate(parsed);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') setIsOpen(false);
    if (e.key === 'Enter') {
      const parsed = parseDate(inputValue);
      if (parsed) onChange?.(formatDate(parsed));
      setIsOpen(false);
    }
  };

  const days = getDaysInMonth(viewDate);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="date-picker" ref={dropdownRef}>
      <div className="date-picker-trigger" onClick={() => !disabled && setIsOpen(true)}>
        <Calendar className="date-picker-icon" size={16} aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => !disabled && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          readOnly
          aria-label={placeholder}
        />
        {value && !disabled && (
          <button
            type="button"
            className="icon-button date-picker-clear"
            onClick={handleClear}
            aria-label="Clear date"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          className="date-picker-dropdown"
          role="dialog"
          aria-label="Select date"
          style={dropdownStyle}
        >
          <div className="date-picker-header">
            <button
              type="button"
              className="icon-button"
              onClick={() => setViewDate(addMonths(viewDate, -1))}
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <select
              className="date-picker-month-select"
              value={viewDate.getMonth()}
              onChange={(e) => setViewDate(new Date(viewDate.getFullYear(), Number(e.target.value), 1))}
              aria-label="Month"
            >
              {MONTHS.map((month, i) => (
                <option key={i} value={i}>{month}</option>
              ))}
            </select>
            <select
              className="date-picker-year-select"
              value={viewDate.getFullYear()}
              onChange={(e) => setViewDate(new Date(Number(e.target.value), viewDate.getMonth(), 1))}
              aria-label="Year"
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <button
              type="button"
              className="icon-button"
              onClick={() => setViewDate(addMonths(viewDate, 1))}
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="date-picker-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="date-picker-days" role="grid" aria-label="Calendar">
            {days.map((day, i) => (
              <button
                key={i}
                type="button"
                className={`date-picker-day${!day.isCurrentMonth ? ' other-month' : ''}${day.isToday ? ' today' : ''}${value && day.date && formatDate(day.date) === value ? ' selected' : ''}`}
                onClick={() => handleSelectDay(day)}
                onMouseDown={(e) => e.preventDefault()}
                disabled={!day.isCurrentMonth}
                role="gridcell"
                aria-selected={value && day.date && formatDate(day.date) === value}
                aria-label={day.date ? formatDate(day.date) : ''}
              >
                {day.day}
              </button>
            ))}
          </div>
          <div className="date-picker-footer">
            <button type="button" className="button secondary small" onClick={handleToday}>
              Today
            </button>
            <button type="button" className="button secondary small" onClick={handleClear}>
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
