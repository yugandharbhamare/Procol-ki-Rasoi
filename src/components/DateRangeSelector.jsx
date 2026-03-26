import { useState, useEffect, useRef } from 'react';
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function DateRangeSelector({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onDownload,
  downloadDisabled = false,
  downloadCount = 0,
  className = "",
  children
}) {
  const [errors, setErrors] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(new Date());
  const [selecting, setSelecting] = useState('start'); // 'start' or 'end'
  const pickerRef = useRef(null);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    validateDates();
  }, [startDate, endDate]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validateDates = () => {
    const newErrors = {};
    if (startDate && endDate && startDate > endDate) {
      newErrors.startDate = 'Start date cannot be after end date';
    }
    if (endDate && endDate > today) {
      newErrors.endDate = 'End date cannot be in the future';
    }
    setErrors(newErrors);
  };

  const clearDates = () => {
    onStartDateChange('');
    onEndDateChange('');
  };

  const setToday = () => {
    onStartDateChange(today);
    onEndDateChange(today);
    setIsOpen(false);
  };

  const setLastWeek = () => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    onStartDateChange(lastWeek.toISOString().split('T')[0]);
    onEndDateChange(today);
    setIsOpen(false);
  };

  const setLastMonth = () => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    onStartDateChange(lastMonth.toISOString().split('T')[0]);
    onEndDateChange(today);
    setIsOpen(false);
  };

  const hasErrors = Object.keys(errors).length > 0;
  const hasDates = startDate || endDate;

  const isTodayActive = startDate === today && endDate === today;
  const isLastWeekActive = startDate === new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] && endDate === today;
  const isLastMonthActive = startDate === new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] && endDate === today;

  // Format date for display
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const displayText = () => {
    if (startDate && endDate) {
      if (startDate === endDate) return formatDisplayDate(startDate);
      return `${formatDisplayDate(startDate)}  —  ${formatDisplayDate(endDate)}`;
    }
    if (startDate) return `From ${formatDisplayDate(startDate)}`;
    if (endDate) return `Until ${formatDisplayDate(endDate)}`;
    return 'Select date range';
  };

  // Calendar helpers
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const toDateStr = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const handleDayClick = (dateStr) => {
    if (dateStr > today) return; // no future dates

    if (selecting === 'start') {
      onStartDateChange(dateStr);
      // If clicked date is after current end, reset end
      if (endDate && dateStr > endDate) {
        onEndDateChange('');
      }
      setSelecting('end');
    } else {
      // selecting end
      if (dateStr < startDate) {
        // Clicked before start — treat as new start
        onStartDateChange(dateStr);
        onEndDateChange('');
        setSelecting('end');
      } else {
        onEndDateChange(dateStr);
        setSelecting('start');
        setIsOpen(false);
      }
    }
  };

  const isInRange = (dateStr) => {
    if (!startDate || !endDate) return false;
    return dateStr >= startDate && dateStr <= endDate;
  };

  const isRangeStart = (dateStr) => dateStr === startDate;
  const isRangeEnd = (dateStr) => dateStr === endDate;

  const prevMonth = () => {
    setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    const next = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
    const todayDate = new Date(today);
    if (next <= new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 1)) {
      setViewMonth(next);
    }
  };

  const renderCalendar = () => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    const days = [];
    // Empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8" />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = toDateStr(year, month, d);
      const isToday = dateStr === today;
      const isFuture = dateStr > today;
      const inRange = isInRange(dateStr);
      const isStart = isRangeStart(dateStr);
      const isEnd = isRangeEnd(dateStr);
      const isSelected = isStart || isEnd;

      let cellBg = '';
      if (inRange && !isSelected) cellBg = 'bg-orange-50';
      if (isStart && endDate && startDate !== endDate) cellBg = 'bg-orange-50 rounded-l-full';
      if (isEnd && startDate && startDate !== endDate) cellBg = 'bg-orange-50 rounded-r-full';
      if (isStart && isEnd) cellBg = '';

      days.push(
        <div key={d} className={`h-8 flex items-center justify-center ${cellBg}`}>
          <button
            onClick={() => handleDayClick(dateStr)}
            disabled={isFuture}
            className={`w-8 h-8 text-sm rounded-full transition-colors
              ${isFuture ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-orange-100 cursor-pointer'}
              ${isSelected ? 'bg-orange-500 text-white hover:bg-orange-600 font-semibold' : ''}
              ${!isSelected && inRange ? 'text-orange-700' : ''}
              ${!isSelected && !inRange && !isFuture ? 'text-gray-700' : ''}
              ${isToday && !isSelected ? 'font-bold ring-1 ring-orange-300' : ''}
            `}
          >
            {d}
          </button>
        </div>
      );
    }

    return (
      <div>
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-3 px-1">
          <button onClick={prevMonth} className="p-1 rounded hover:bg-gray-100">
            <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-sm font-semibold text-gray-800">
            {viewMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={nextMonth} className="p-1 rounded hover:bg-gray-100">
            <ChevronRightIcon className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 mb-1">
          {dayNames.map(d => (
            <div key={d} className="h-8 flex items-center justify-center text-xs font-medium text-gray-400">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow p-3 sm:p-4 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center sm:justify-start">
        {/* Date Range Picker Trigger */}
        <div className="relative w-full sm:w-auto" ref={pickerRef}>
          <button
            onClick={() => {
              setIsOpen(!isOpen);
              if (!isOpen) {
                setSelecting('start');
                // Set view month to start date or today
                const refDate = startDate ? new Date(startDate + 'T00:00:00') : new Date();
                setViewMonth(new Date(refDate.getFullYear(), refDate.getMonth(), 1));
              }
            }}
            className="flex items-center gap-2 px-3 py-2 h-10 border border-gray-300 rounded-lg hover:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors w-full sm:w-auto min-w-[260px]"
          >
            <CalendarDaysIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className={`text-sm ${hasDates ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
              {displayText()}
            </span>
          </button>

          {hasDates && (
            <button
              onClick={(e) => { e.stopPropagation(); clearDates(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Dropdown Calendar */}
          {isOpen && (
            <div className="absolute top-12 left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-[300px]">
              {/* Quick presets */}
              <div className="flex gap-1.5 mb-3">
                <button
                  onClick={setToday}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    isTodayActive
                      ? 'border-orange-500 bg-orange-50 text-orange-600 font-medium'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={setLastWeek}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    isLastWeekActive
                      ? 'border-orange-500 bg-orange-50 text-orange-600 font-medium'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Last 7 days
                </button>
                <button
                  onClick={setLastMonth}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    isLastMonthActive
                      ? 'border-orange-500 bg-orange-50 text-orange-600 font-medium'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Last 30 days
                </button>
              </div>

              {/* Hint */}
              <p className="text-[10px] text-gray-400 mb-2 text-center">
                {selecting === 'start' ? 'Select start date' : 'Select end date'}
              </p>

              {/* Calendar */}
              {renderCalendar()}
            </div>
          )}
        </div>

        {/* Extra controls (e.g. filter button) */}
        {children}

        {/* Download Button */}
        <button
          onClick={onDownload}
          disabled={downloadDisabled}
          className="w-full sm:w-auto sm:ml-auto bg-green-600 text-white px-4 py-2 h-10 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download
        </button>
      </div>

      {/* Error Summary */}
      {hasErrors && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <ul className="text-sm text-red-700 list-disc list-inside">
            {Object.values(errors).map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
